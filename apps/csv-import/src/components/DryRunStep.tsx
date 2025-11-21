import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  Text,
  Badge,
  Note,
  Heading,
  Stack,
  Collapse,
  IconButton,
} from '@contentful/f36-components';
import { ChevronDownIcon, ChevronUpIcon, DownloadIcon } from '@contentful/f36-icons';
import {
  ParsedRow,
  ColumnMapping,
  ContentTypeMeta,
  DryRunResultRow,
  ValidationIssue,
  ImportMode,
} from '../lib/types';
import { resolveFieldValues, getFieldById, extractReferenceIds } from '../lib/mapping';
import { validateFieldValue } from '../lib/validation';
import { batchCheckReferences } from '../lib/references';
import { exportErrorsCSV } from '../lib/csv';
import { unique } from '../lib/utils';

interface DryRunStepProps {
  mode: ImportMode;
  rows: ParsedRow[];
  mappings: ColumnMapping[];
  contentType: ContentTypeMeta;
  defaultLocale: string;
  checkReferenceFn: (id: string) => Promise<boolean>;
  searchByFieldFn?: (
    contentTypeId: string,
    fieldId: string,
    value: string,
    locale?: string
  ) => Promise<string[]>;
  naturalKeyField?: string;
  naturalKeyLocale?: string;
  onComplete: (results: DryRunResultRow[], matchedEntries: Map<number, string>) => void;
}

/**
 * Component for dry-run validation
 */
export function DryRunStep({
  mode,
  rows,
  mappings,
  contentType,
  defaultLocale,
  checkReferenceFn,
  searchByFieldFn,
  naturalKeyField,
  naturalKeyLocale,
  onComplete,
}: DryRunStepProps) {
  const [validating, setValidating] = useState(false);
  const [results, setResults] = useState<DryRunResultRow[]>([]);
  const [matchedEntries, setMatchedEntries] = useState<Map<number, string>>(new Map());
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    runDryRun();
  }, []);

  const runDryRun = async () => {
    setValidating(true);

    try {
      const dryRunResults: DryRunResultRow[] = [];
      const entryMatches = new Map<number, string>();

      // Step 1: Collect all reference IDs
      const allRefIds: string[] = [];
      for (const row of rows) {
        const refIds = extractReferenceIds(row, mappings, contentType);
        allRefIds.push(...refIds);
      }
      const uniqueRefIds = unique(allRefIds);

      // Step 2: Batch check references
      const existingRefs = await batchCheckReferences(uniqueRefIds, checkReferenceFn);

      // Step 3: Validate each row
      for (const row of rows) {
        const issues: ValidationIssue[] = [];

        // Resolve field values
        const fieldValues = resolveFieldValues(row, mappings, contentType, defaultLocale);

        // Validate each field value
        for (const fv of fieldValues) {
          const field = getFieldById(contentType, fv.fieldId);
          if (!field) continue;

          // Find the column name for this field
          const mapping = mappings.find((m) => m.fieldId === fv.fieldId);
          const columnName = mapping?.columnName || fv.fieldId;

          const fieldIssues = validateFieldValue(field, fv.value, row.rowIndex, columnName);
          issues.push(...fieldIssues);

          // Check reference existence
          if (field.type === 'Link') {
            if (fv.value?.sys?.id) {
              const id = fv.value.sys.id;
              if (!existingRefs.has(id)) {
                issues.push({
                  rowIndex: row.rowIndex,
                  columnName,
                  fieldId: fv.fieldId,
                  severity: 'error',
                  message: `Referenced entry "${id}" does not exist`,
                  suggestion: 'Check the entry ID or create the entry first',
                });
              }
            }
          } else if (field.type === 'Array' && field.itemsType === 'Link') {
            if (Array.isArray(fv.value)) {
              fv.value.forEach((item, idx) => {
                if (item?.sys?.id) {
                  const id = item.sys.id;
                  if (!existingRefs.has(id)) {
                    issues.push({
                      rowIndex: row.rowIndex,
                      columnName,
                      fieldId: fv.fieldId,
                      severity: 'error',
                      message: `Referenced entry "${id}" in array position ${
                        idx + 1
                      } does not exist`,
                      suggestion: 'Check the entry ID or create the entry first',
                    });
                  }
                }
              });
            }
          }
        }

        // Update mode: resolve entry to update
        let matchedEntryId: string | undefined;
        if (mode === 'update') {
          // Check for sys.id column
          const sysIdValue = row.raw['sys.id'];
          if (sysIdValue && sysIdValue.trim()) {
            const exists = await checkReferenceFn(sysIdValue.trim());
            if (exists) {
              matchedEntryId = sysIdValue.trim();
              entryMatches.set(row.rowIndex, matchedEntryId);
            } else {
              issues.push({
                rowIndex: row.rowIndex,
                columnName: 'sys.id',
                severity: 'error',
                message: `Entry with sys.id "${sysIdValue}" does not exist`,
                suggestion: 'Check the entry ID or use create mode',
              });
            }
          } else if (naturalKeyField && searchByFieldFn) {
            // Use natural key
            const keyMapping = mappings.find((m) => m.fieldId === naturalKeyField);
            if (keyMapping) {
              const keyValue = row.raw[keyMapping.columnName];
              if (keyValue && keyValue.trim()) {
                const matchingIds = await searchByFieldFn(
                  contentType.id,
                  naturalKeyField,
                  keyValue.trim(),
                  naturalKeyLocale
                );

                if (matchingIds.length === 1) {
                  matchedEntryId = matchingIds[0];
                  entryMatches.set(row.rowIndex, matchedEntryId);
                } else if (matchingIds.length === 0) {
                  issues.push({
                    rowIndex: row.rowIndex,
                    columnName: keyMapping.columnName,
                    fieldId: naturalKeyField,
                    severity: 'error',
                    message: `No entry found with ${naturalKeyField} = "${keyValue}"`,
                    suggestion: 'Check the value or use create mode',
                  });
                } else {
                  issues.push({
                    rowIndex: row.rowIndex,
                    columnName: keyMapping.columnName,
                    fieldId: naturalKeyField,
                    severity: 'error',
                    message: `Multiple entries (${matchingIds.length}) found with ${naturalKeyField} = "${keyValue}"`,
                    suggestion: 'Natural key must uniquely identify one entry',
                  });
                }
              } else {
                issues.push({
                  rowIndex: row.rowIndex,
                  columnName: keyMapping.columnName,
                  fieldId: naturalKeyField,
                  severity: 'error',
                  message: `Natural key field "${naturalKeyField}" is missing`,
                  suggestion: 'Provide a value for the natural key field',
                });
              }
            }
          } else {
            issues.push({
              rowIndex: row.rowIndex,
              severity: 'error',
              message: 'No sys.id or natural key provided for update',
              suggestion: 'Include sys.id column or configure a natural key field',
            });
          }
        }

        const errorCount = issues.filter((i) => i.severity === 'error').length;

        dryRunResults.push({
          rowIndex: row.rowIndex,
          matchedEntryId,
          ok: errorCount === 0,
          issues,
        });
      }

      setResults(dryRunResults);
      setMatchedEntries(entryMatches);
    } finally {
      setValidating(false);
    }
  };

  const toggleRow = (rowIndex: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) {
        next.delete(rowIndex);
      } else {
        next.add(rowIndex);
      }
      return next;
    });
  };

  const handleDownloadErrors = () => {
    const errorRows: Array<Record<string, any>> = [];

    for (const result of results) {
      for (const issue of result.issues) {
        errorRows.push({
          rowIndex: issue.rowIndex,
          columnName: issue.columnName || '',
          fieldId: issue.fieldId || '',
          severity: issue.severity,
          message: issue.message,
          suggestion: issue.suggestion || '',
        });
      }
    }

    exportErrorsCSV(errorRows);
  };

  const handleContinue = () => {
    onComplete(results, matchedEntries);
  };

  const okCount = results.filter((r) => r.ok).length;
  const errorCount = results.filter((r) => !r.ok).length;
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

  if (validating) {
    return (
      <Box>
        <Heading as="h2" marginBottom="spacingM">
          Running Dry Run Validation...
        </Heading>
        <Text>Validating {rows.length} row(s)...</Text>
      </Box>
    );
  }

  return (
    <Stack flexDirection="column" spacing="spacingL">
      <Box>
        <Heading as="h2" marginBottom="spacingM">
          Dry Run Results
        </Heading>
        <Stack flexDirection="row" spacing="spacingM">
          <Badge variant={okCount > 0 ? 'positive' : 'secondary'}>{okCount} OK</Badge>
          <Badge variant={errorCount > 0 ? 'negative' : 'secondary'}>{errorCount} Errors</Badge>
          <Badge variant="secondary">{totalIssues} Total Issues</Badge>
        </Stack>
      </Box>

      {errorCount > 0 && (
        <Note variant="warning" title="Validation Issues Found">
          {errorCount} row(s) have errors that must be fixed before import. Review the issues below
          and fix them in your CSV file, then re-upload.
        </Note>
      )}

      {results.length > 0 && (
        <Box>
          <Box marginBottom="spacingM">
            <Button
              variant="secondary"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadErrors}
              isDisabled={totalIssues === 0}>
              Download Errors CSV
            </Button>
          </Box>

          <Box
            style={{
              maxHeight: '500px',
              overflow: 'auto',
              border: '1px solid #d3dce0',
              borderRadius: '4px',
            }}>
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Cell style={{ width: '40px' }}></Table.Cell>
                  <Table.Cell>Row</Table.Cell>
                  {mode === 'update' && <Table.Cell>Matched Entry</Table.Cell>}
                  <Table.Cell>Status</Table.Cell>
                  <Table.Cell>Issues</Table.Cell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {results.map((result) => (
                  <React.Fragment key={result.rowIndex}>
                    <Table.Row>
                      <Table.Cell>
                        {result.issues.length > 0 && (
                          <IconButton
                            variant="transparent"
                            icon={
                              expandedRows.has(result.rowIndex) ? (
                                <ChevronUpIcon />
                              ) : (
                                <ChevronDownIcon />
                              )
                            }
                            aria-label="Toggle details"
                            onClick={() => toggleRow(result.rowIndex)}
                          />
                        )}
                      </Table.Cell>
                      <Table.Cell>{result.rowIndex}</Table.Cell>
                      {mode === 'update' && (
                        <Table.Cell>
                          {result.matchedEntryId ? (
                            <Badge variant="positive">{result.matchedEntryId}</Badge>
                          ) : (
                            <Badge variant="negative">Not matched</Badge>
                          )}
                        </Table.Cell>
                      )}
                      <Table.Cell>
                        <Badge variant={result.ok ? 'positive' : 'negative'}>
                          {result.ok ? 'OK' : 'Has Errors'}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>{result.issues.length}</Table.Cell>
                    </Table.Row>
                    {expandedRows.has(result.rowIndex) && result.issues.length > 0 && (
                      <Table.Row>
                        <Table.Cell colSpan={mode === 'update' ? 5 : 4}>
                          <Box padding="spacingS" style={{ backgroundColor: '#f7f9fa' }}>
                            <Stack flexDirection="column" spacing="spacingXs">
                              {result.issues.map((issue, idx) => (
                                <Box key={idx}>
                                  <Badge
                                    variant={
                                      issue.severity === 'error'
                                        ? 'negative'
                                        : issue.severity === 'warning'
                                        ? 'warning'
                                        : 'secondary'
                                    }
                                    style={{ marginRight: '8px' }}>
                                    {issue.severity.toUpperCase()}
                                  </Badge>
                                  <Text fontWeight="fontWeightDemiBold">
                                    {issue.columnName || issue.fieldId || 'General'}:
                                  </Text>{' '}
                                  {issue.message}
                                  {issue.suggestion && (
                                    <Text fontSize="fontSizeS" fontColor="gray600">
                                      {' '}
                                      — {issue.suggestion}
                                    </Text>
                                  )}
                                </Box>
                              ))}
                            </Stack>
                          </Box>
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </React.Fragment>
                ))}
              </Table.Body>
            </Table>
          </Box>
        </Box>
      )}

      <Box>
        <Button variant="primary" onClick={handleContinue} isDisabled={okCount === 0}>
          Continue to Import ({okCount} valid rows)
        </Button>
      </Box>
    </Stack>
  );
}
