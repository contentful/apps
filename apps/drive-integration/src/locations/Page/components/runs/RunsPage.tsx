import { Box, Button, Flex, Heading, Note, Text } from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { useRunStorage } from '../../../../hooks/useRunStorage';
import { useRunsPolling } from '../../../../hooks/useRunsPolling';
import type { RunWithStatus } from '../../../../types/runs';
import { RunRow } from './RunRow';

interface RunsPageProps {
  sdk: PageAppSDK;
  onNewImport: () => void;
  onReviewRun: (runId: string) => void;
}

export function RunsPage({ sdk, onNewImport, onReviewRun }: RunsPageProps) {
  const spaceId = sdk.ids.space;
  const environmentId = sdk.ids.environmentAlias ?? sdk.ids.environment;

  const { runs, removeRun, storageError } = useRunStorage(spaceId, environmentId);
  const { statusMap, errorMap } = useRunsPolling(runs, sdk);

  const runsWithStatus: RunWithStatus[] = runs.map((r) => ({
    ...r,
    displayStatus: statusMap.get(r.runId) ?? 'loading',
    errorMessage: errorMap.get(r.runId),
  }));

  return (
    <Box>
      {/* Header */}
      <Flex
        justifyContent="space-between"
        alignItems="center"
        padding="spacingM"
        style={{ borderBottom: '1px solid var(--color-element-light)' }}>
        <Heading marginBottom="none">Import Runs</Heading>
        <Button variant="primary" size="small" onClick={onNewImport}>
          New Import
        </Button>
      </Flex>

      {/* Storage error */}
      {storageError && (
        <Box padding="spacingM">
          <Note variant="negative">{storageError}</Note>
        </Box>
      )}

      {/* Run list or empty state */}
      {runsWithStatus.length === 0 ? (
        <Flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap="spacingM"
          padding="spacingXl"
          style={{ minHeight: '300px' }}>
          <Text>No imports yet</Text>
          <Button variant="primary" onClick={onNewImport}>
            Start your first import
          </Button>
        </Flex>
      ) : (
        runsWithStatus.map((run) => (
          <RunRow
            key={run.runId}
            run={run}
            spaceId={spaceId}
            onReview={onReviewRun}
            onDismiss={removeRun}
          />
        ))
      )}
    </Box>
  );
}
