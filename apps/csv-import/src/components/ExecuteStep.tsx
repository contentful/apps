import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Text, Badge, Note, Heading, Stack } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';
import {
  ParsedRow,
  ColumnMapping,
  ContentTypeMeta,
  DryRunResultRow,
  ImportMode,
  ExecutionOutcome,
} from '../lib/types';
import { executeImport } from '../lib/importer';

interface ExecuteStepProps {
  mode: ImportMode;
  rows: ParsedRow[];
  mappings: ColumnMapping[];
  contentType: ContentTypeMeta;
  defaultLocale: string;
  shouldPublish: boolean;
  dryRunResults: DryRunResultRow[];
  matchedEntries: Map<number, string>;
  onComplete: (outcome: ExecutionOutcome) => void;
}

/**
 * Component for executing the import with progress tracking
 */
export function ExecuteStep({
  mode,
  rows,
  mappings,
  contentType,
  defaultLocale,
  shouldPublish,
  dryRunResults,
  matchedEntries,
  onComplete,
}: ExecuteStepProps) {
  const sdk = useSDK<PageAppSDK>();
  const [executing, setExecuting] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    startImport();
  }, []);

  const startImport = async () => {
    // Filter to only valid rows
    const validRows = rows.filter((row) => {
      const result = dryRunResults.find((r) => r.rowIndex === row.rowIndex);
      return result?.ok;
    });

    setTotal(validRows.length);
    setExecuting(true);
    setError(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const outcome = await executeImport(
        sdk.cma,
        sdk.ids.space,
        sdk.ids.environment,
        contentType.id,
        mode,
        validRows,
        mappings,
        contentType,
        defaultLocale,
        shouldPublish,
        matchedEntries,
        (completedCount, totalCount) => {
          setCompleted(completedCount);
          setTotal(totalCount);
        },
        abortController.signal
      );

      onComplete(outcome);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setExecuting(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <Stack flexDirection="column" spacing="spacingL">
      <Box>
        <Heading as="h2" marginBottom="spacingM">
          Importing Entries
        </Heading>
      </Box>

      {error && (
        <Note variant="negative" title="Import Error">
          {error}
        </Note>
      )}

      <Box>
        <Stack flexDirection="column" spacing="spacingM">
          <Box>
            <Text fontSize="fontSizeL" fontWeight="fontWeightDemiBold">
              {completed} / {total}
            </Text>
            <Text fontSize="fontSizeM" fontColor="gray600">
              {executing ? 'Processing...' : 'Complete'}
            </Text>
          </Box>

          <Box>
            <Box
              style={{
                width: '100%',
                height: '24px',
                backgroundColor: '#e3e8ee',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
              <Box
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#0066ff',
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>
            <Text fontSize="fontSizeS" fontColor="gray600" marginTop="spacingXs">
              {progress.toFixed(1)}% complete
            </Text>
          </Box>

          <Stack flexDirection="row" spacing="spacingM">
            <Badge variant="secondary">Mode: {mode === 'create' ? 'Create' : 'Update'}</Badge>
            {shouldPublish && <Badge variant="positive">Publishing</Badge>}
          </Stack>
        </Stack>
      </Box>

      {executing && (
        <Box>
          <Button variant="negative" onClick={handleCancel}>
            Cancel Import
          </Button>
        </Box>
      )}

      {!executing && !error && (
        <Note variant="positive" title="Import Complete">
          Import completed successfully. Review the summary below.
        </Note>
      )}
    </Stack>
  );
}
