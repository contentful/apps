import { Badge, Box, Button, Flex, Spinner, Text, TextLink } from '@contentful/f36-components';
import type { RunWithStatus } from '../../../../types/runs';

interface RunRowProps {
  run: RunWithStatus;
  spaceId: string;
  onReview: (runId: string) => void;
  onDismiss: (runId: string) => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function StatusBadge({ status }: { status: RunWithStatus['displayStatus'] }) {
  switch (status) {
    case 'loading':
      return <Spinner size="small" />;
    case 'running':
      return (
        <Flex alignItems="center" gap="spacing2Xs">
          <Badge variant="primary">Running</Badge>
          <Spinner size="small" />
        </Flex>
      );
    case 'needs-review':
      return <Badge variant="warning">Needs Review</Badge>;
    case 'completed':
      return <Badge variant="positive">Completed</Badge>;
    case 'failed':
      return <Badge variant="negative">Failed</Badge>;
    case 'expired':
      return <Badge variant="secondary">Expired</Badge>;
  }
}

export function RunRow({ run, spaceId, onReview, onDismiss }: RunRowProps) {
  const contentTypesLabel =
    run.contentTypeIds.length <= 3
      ? run.contentTypeIds.join(', ')
      : `${run.contentTypeIds.slice(0, 3).join(', ')} +${run.contentTypeIds.length - 3} more`;

  return (
    <Box
      padding="spacingM"
      style={{ borderBottom: '1px solid var(--color-element-light)', background: '#fff' }}>
      <Flex justifyContent="space-between" alignItems="flex-start" gap="spacingM">
        {/* Left: metadata */}
        <Flex flexDirection="column" gap="spacing2Xs" style={{ flex: 1, minWidth: 0 }}>
          <Text fontWeight="fontWeightMedium" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {run.documentTitle}
          </Text>
          <Text fontSize="fontSizeS" fontColor="gray600">
            {contentTypesLabel}
          </Text>
          <Text fontSize="fontSizeS" fontColor="gray500">
            {formatDate(run.startedAt)}
          </Text>

          {/* Entry links for completed runs */}
          {run.displayStatus === 'completed' && run.createdEntryIds && run.createdEntryIds.length > 0 && (
            <Flex gap="spacingXs" flexWrap="wrap">
              {run.createdEntryIds.map((entryId) => (
                <TextLink
                  key={entryId}
                  href={`https://app.contentful.com/spaces/${spaceId}/entries/${entryId}`}
                  target="_blank"
                  rel="noopener noreferrer">
                  {entryId}
                </TextLink>
              ))}
            </Flex>
          )}

          {/* Error message for failed runs */}
          {run.displayStatus === 'failed' && run.errorMessage && (
            <Text fontSize="fontSizeS" fontColor="red600">
              {run.errorMessage}
            </Text>
          )}
        </Flex>

        {/* Right: status + actions */}
        <Flex flexDirection="column" alignItems="flex-end" gap="spacingXs">
          <StatusBadge status={run.displayStatus} />

          {run.displayStatus === 'needs-review' && (
            <Button variant="secondary" size="small" onClick={() => onReview(run.runId)}>
              Review
            </Button>
          )}

          {(run.displayStatus === 'failed' || run.displayStatus === 'expired') && (
            <Button variant="secondary" size="small" onClick={() => onDismiss(run.runId)}>
              Dismiss
            </Button>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}
