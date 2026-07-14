import { Note, Button, Flex, Text, Box } from '@contentful/f36-components';
import type { ExportProgress } from '../lib/exporter';

export interface ProgressPanelProps {
  progress: ExportProgress | null;
  onCancel: () => void;
}

export function ProgressPanel({ progress, onCancel }: ProgressPanelProps) {
  if (!progress) return null;

  const { fetched, total, status, message } = progress;
  const percentage = total > 0 ? Math.round((fetched / total) * 100) : 0;

  if (status === 'error') {
    return (
      <Note variant="negative" title="Export Error">
        {message}
      </Note>
    );
  }

  if (status === 'cancelled') {
    return (
      <Note variant="warning" title="Export Cancelled">
        {message}
      </Note>
    );
  }

  if (status === 'complete') {
    return (
      <Note variant="positive" title="Export Complete">
        {message}
      </Note>
    );
  }

  return (
    <Flex flexDirection="column" gap="spacingS">
      <Text>{message}</Text>

      {status === 'fetching' && total > 0 && (
        <Flex flexDirection="column" gap="spacingXs">
          <Text>
            {fetched.toLocaleString()} / {total.toLocaleString()} entries ({percentage}%)
          </Text>
          <Box
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e5e8ed',
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
            <Box
              style={{
                width: `${percentage}%`,
                height: '100%',
                backgroundColor: '#0066ff',
                transition: 'width 0.3s ease',
              }}
            />
          </Box>
        </Flex>
      )}

      {(status === 'estimating' || status === 'processing') && (
        <Note variant="primary">{message}</Note>
      )}

      {status === 'fetching' && (
        <Button variant="negative" size="small" onClick={onCancel}>
          Cancel Export
        </Button>
      )}
    </Flex>
  );
}
