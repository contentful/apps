import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  FormControl,
  Select,
  TextInput,
  Checkbox,
  Stack,
  Table,
  Text,
  Badge,
  Note,
  Heading,
} from '@contentful/f36-components';
import { CloudUploadIcon } from '@contentful/f36-icons';
import { ContentTypeMeta, ColumnMapping, ParsedRow } from '../lib/types';
import { parseCSV, getColumnNames } from '../lib/csv';
import { suggestMappings, getFieldById } from '../lib/mapping';
import { Locale } from '../hooks/useLocales';

interface MappingStepProps {
  contentType: ContentTypeMeta;
  locales: Locale[];
  defaultLocale: string;
  onComplete: (rows: ParsedRow[], mappings: ColumnMapping[]) => void;
}

/**
 * Component for CSV upload, preview, and column-to-field mapping
 */
export function MappingStep({ contentType, locales, defaultLocale, onComplete }: MappingStepProps) {
  const [csvRows, setCsvRows] = useState<ParsedRow[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) {
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const rows = await parseCSV(file);

      if (rows.length === 0) {
        throw new Error('CSV file is empty');
      }

      setCsvRows(rows);

      // Suggest automatic mappings
      const columnNames = getColumnNames(rows);
      const suggestedMappings = suggestMappings(columnNames, contentType);
      setMappings(suggestedMappings);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to parse CSV');
      setCsvRows([]);
      setMappings([]);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleMappingChange = (columnName: string, fieldId: string | null) => {
    setMappings((prev) => prev.map((m) => (m.columnName === columnName ? { ...m, fieldId } : m)));
  };

  const handleLocaleChange = (columnName: string, locale: string) => {
    setMappings((prev) =>
      prev.map((m) => (m.columnName === columnName ? { ...m, targetLocale: locale } : m))
    );
  };

  const handleArrayToggle = (columnName: string, isArray: boolean) => {
    setMappings((prev) => prev.map((m) => (m.columnName === columnName ? { ...m, isArray } : m)));
  };

  const handleDelimiterChange = (columnName: string, delimiter: string) => {
    setMappings((prev) =>
      prev.map((m) => (m.columnName === columnName ? { ...m, arrayDelimiter: delimiter } : m))
    );
  };

  const handleContinue = () => {
    if (csvRows.length === 0 || mappings.length === 0) {
      return;
    }
    onComplete(csvRows, mappings);
  };

  const unmappedCount = mappings.filter((m) => !m.fieldId).length;
  const mappedCount = mappings.filter((m) => m.fieldId).length;
  const previewRows = csvRows.slice(0, 50);

  return (
    <Stack flexDirection="column" spacing="spacingL">
      {/* File Upload */}
      <Box>
        <Heading as="h2" marginBottom="spacingM">
          Upload CSV File
        </Heading>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <Button
          variant="primary"
          startIcon={<CloudUploadIcon />}
          onClick={() => fileInputRef.current?.click()}
          isDisabled={uploading}
          isLoading={uploading}>
          {uploading
            ? 'Uploading...'
            : csvRows.length > 0
            ? 'Upload Different File'
            : 'Upload CSV File'}
        </Button>
        {uploadError && (
          <Box marginTop="spacingS">
            <Note variant="negative" title="Upload Error">
              {uploadError}
            </Note>
          </Box>
        )}
      </Box>

      {/* Mapping Configuration */}
      {csvRows.length > 0 && (
        <>
          <Box>
            <Heading as="h2" marginBottom="spacingM">
              Map Columns to Fields
            </Heading>
            <Text fontSize="fontSizeM" marginBottom="spacingM">
              {csvRows.length} row(s) loaded. {mappedCount} column(s) mapped, {unmappedCount}{' '}
              unmapped.
            </Text>

            <Stack flexDirection="column" spacing="spacingM">
              {mappings.map((mapping) => {
                const field = mapping.fieldId ? getFieldById(contentType, mapping.fieldId) : null;

                return (
                  <Box
                    key={mapping.columnName}
                    padding="spacingM"
                    style={{
                      border: '1px solid #d3dce0',
                      borderRadius: '4px',
                      backgroundColor: '#f7f9fa',
                    }}>
                    <Stack flexDirection="row" spacing="spacingM" alignItems="flex-start">
                      <Box style={{ flex: 1 }}>
                        <FormControl>
                          <FormControl.Label>
                            <Text fontWeight="fontWeightDemiBold">{mapping.columnName}</Text>
                          </FormControl.Label>
                          <Select
                            value={mapping.fieldId || ''}
                            onChange={(e) =>
                              handleMappingChange(mapping.columnName, e.target.value || null)
                            }>
                            <Select.Option value="">-- Unmapped --</Select.Option>
                            {contentType.fields
                              .filter((f) => !f.disabled && !f.omitted)
                              .map((f) => (
                                <Select.Option key={f.id} value={f.id}>
                                  {f.name} ({f.type}){f.localized ? ' [localized]' : ''}
                                  {f.required ? ' *' : ''}
                                </Select.Option>
                              ))}
                          </Select>
                        </FormControl>
                      </Box>

                      {field && (
                        <>
                          {field.localized && (
                            <Box style={{ flex: 1 }}>
                              <FormControl>
                                <FormControl.Label>Target Locale</FormControl.Label>
                                <Select
                                  value={mapping.targetLocale || defaultLocale}
                                  onChange={(e) =>
                                    handleLocaleChange(mapping.columnName, e.target.value)
                                  }>
                                  {locales.map((locale) => (
                                    <Select.Option key={locale.code} value={locale.code}>
                                      {locale.name} ({locale.code})
                                    </Select.Option>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>
                          )}

                          {field.type === 'Array' && (
                            <Box style={{ flex: 1 }}>
                              <FormControl>
                                <Checkbox
                                  isChecked={mapping.isArray}
                                  onChange={(e) =>
                                    handleArrayToggle(mapping.columnName, e.target.checked)
                                  }>
                                  Treat as Array
                                </Checkbox>
                              </FormControl>
                              {mapping.isArray && (
                                <TextInput
                                  value={mapping.arrayDelimiter || '|'}
                                  onChange={(e) =>
                                    handleDelimiterChange(mapping.columnName, e.target.value)
                                  }
                                  placeholder="Delimiter (e.g., |)"
                                  maxLength={1}
                                />
                              )}
                            </Box>
                          )}
                        </>
                      )}

                      <Box>
                        {field && (
                          <Stack flexDirection="row" spacing="spacingXs">
                            <Badge variant="secondary">{field.type}</Badge>
                            {field.localized && <Badge variant="positive">Localized</Badge>}
                            {field.required && <Badge variant="warning">Required</Badge>}
                          </Stack>
                        )}
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          {/* CSV Preview */}
          <Box>
            <Heading as="h2" marginBottom="spacingM">
              Preview (first {previewRows.length} rows)
            </Heading>
            <Box
              style={{
                maxHeight: '400px',
                overflow: 'auto',
                border: '1px solid #d3dce0',
                borderRadius: '4px',
              }}>
              <Table>
                <Table.Head>
                  <Table.Row>
                    <Table.Cell>Row</Table.Cell>
                    {mappings.map((m) => (
                      <Table.Cell key={m.columnName}>{m.columnName}</Table.Cell>
                    ))}
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {previewRows.map((row) => (
                    <Table.Row key={row.rowIndex}>
                      <Table.Cell>{row.rowIndex}</Table.Cell>
                      {mappings.map((m) => (
                        <Table.Cell key={m.columnName}>{row.raw[m.columnName] || ''}</Table.Cell>
                      ))}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </Box>
          </Box>

          {/* Continue Button */}
          <Box>
            {unmappedCount > 0 && (
              <Note variant="warning" title="Unmapped Columns" marginBottom="spacingM">
                {unmappedCount} column(s) are not mapped to any field. They will be ignored during
                import.
              </Note>
            )}
            <Button variant="primary" onClick={handleContinue} isDisabled={mappedCount === 0}>
              Continue to Dry Run
            </Button>
          </Box>
        </>
      )}
    </Stack>
  );
}
