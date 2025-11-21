import React from 'react';
import { Box, Button, Text, Badge, Note, Heading, Stack, Table } from '@contentful/f36-components';
import { DownloadIcon, ExternalLinkIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';
import { ExecutionOutcome, ImportMode } from '../lib/types';
import { exportResultsCSV } from '../lib/csv';

interface SummaryStepProps {
  mode: ImportMode;
  outcome: ExecutionOutcome;
  onStartOver: () => void;
}

/**
 * Component showing import summary and results
 */
export function SummaryStep({ mode, outcome, onStartOver }: SummaryStepProps) {
  const sdk = useSDK<PageAppSDK>();

  const handleDownloadResults = () => {
    const results: Array<Record<string, any>> = [];

    // Add successful entries
    const successCount = outcome.created + outcome.updated;
    for (let i = 0; i < successCount; i++) {
      results.push({
        status: 'success',
        action: mode === 'create' ? 'created' : 'updated',
        published: outcome.published > i ? 'yes' : 'no',
      });
    }

    // Add failed entries
    for (const failed of outcome.failed) {
      results.push({
        rowIndex: failed.rowIndex,
        entryId: failed.entryId || '',
        status: 'failed',
        reason: failed.reason,
      });
    }

    exportResultsCSV(results);
  };

  const totalProcessed = outcome.created + outcome.updated + outcome.failed.length;
  const successRate =
    totalProcessed > 0 ? ((outcome.created + outcome.updated) / totalProcessed) * 100 : 0;

  return (
    <Stack flexDirection="column" spacing="spacingL">
      <Box>
        <Heading as="h1" marginBottom="spacingM">
          Import Complete
        </Heading>
      </Box>

      <Box>
        <Stack flexDirection="row" spacing="spacingM">
          {outcome.created > 0 && (
            <Badge variant="positive" size="large">
              {outcome.created} Created
            </Badge>
          )}
          {outcome.updated > 0 && (
            <Badge variant="positive" size="large">
              {outcome.updated} Updated
            </Badge>
          )}
          {outcome.published > 0 && (
            <Badge variant="featured" size="large">
              {outcome.published} Published
            </Badge>
          )}
          {outcome.failed.length > 0 && (
            <Badge variant="negative" size="large">
              {outcome.failed.length} Failed
            </Badge>
          )}
        </Stack>
      </Box>

      <Box>
        <Text fontSize="fontSizeL">
          Success Rate:{' '}
          <strong>
            {successRate.toFixed(1)}% ({outcome.created + outcome.updated} / {totalProcessed})
          </strong>
        </Text>
      </Box>

      {outcome.failed.length === 0 ? (
        <Note variant="positive" title="All Entries Processed Successfully">
          All entries were {mode === 'create' ? 'created' : 'updated'} successfully.
          {outcome.published > 0 && ` ${outcome.published} entries were published.`}
        </Note>
      ) : (
        <Note variant="warning" title="Some Entries Failed">
          {outcome.failed.length} row(s) failed to import. See details below.
        </Note>
      )}

      {outcome.failed.length > 0 && (
        <Box>
          <Heading as="h2" marginBottom="spacingM">
            Failed Entries
          </Heading>
          <Box
            style={{
              maxHeight: '300px',
              overflow: 'auto',
              border: '1px solid #d3dce0',
              borderRadius: '4px',
            }}>
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Cell>Row</Table.Cell>
                  <Table.Cell>Entry ID</Table.Cell>
                  <Table.Cell>Reason</Table.Cell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {outcome.failed.map((failed, idx) => (
                  <Table.Row key={idx}>
                    <Table.Cell>{failed.rowIndex}</Table.Cell>
                    <Table.Cell>{failed.entryId || '-'}</Table.Cell>
                    <Table.Cell>{failed.reason}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </Box>
        </Box>
      )}

      <Stack flexDirection="row" spacing="spacingM">
        <Button variant="secondary" startIcon={<DownloadIcon />} onClick={handleDownloadResults}>
          Download Results CSV
        </Button>
        <Button variant="primary" onClick={onStartOver}>
          Start New Import
        </Button>
      </Stack>
    </Stack>
  );
}
