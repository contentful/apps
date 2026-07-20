import { useState } from 'react';
import {
  Badge,
  Button,
  Flex,
  TableCell,
  TableRow,
  Text,
  TextLink,
  Tooltip,
} from '@contentful/f36-components';
import { DisplayStatus } from '../../../../types/runs';
import type { RunWithStatus } from '../../../../types/runs';

interface RunRowProps {
  run: RunWithStatus;
  spaceId: string;
  webappHost: string;
  onReview: (runId: string) => void;
  onRetry: (runId: string) => Promise<void>;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusBadge({
  status,
  errorMessage,
}: {
  status: RunWithStatus['displayStatus'];
  errorMessage?: string;
}) {
  switch (status) {
    case DisplayStatus.LOADING:
      return (
        <Badge
          variant="secondary"
          style={{ background: '#F0F2F5', color: '#536171', border: 'none' }}>
          Loading
        </Badge>
      );
    case DisplayStatus.RUNNING:
      return (
        <Badge
          variant="primary"
          style={{ background: '#EAF0FB', color: '#0059C8', border: 'none', fontWeight: 500 }}>
          In progress
        </Badge>
      );
    case DisplayStatus.NEEDS_REVIEW:
      return (
        <Badge
          variant="positive"
          style={{ background: '#EAF7EC', color: '#1B7230', border: 'none', fontWeight: 500 }}>
          Ready for review
        </Badge>
      );
    case DisplayStatus.COMPLETED:
      return (
        <Badge
          variant="secondary"
          style={{ background: '#F0F2F5', color: '#536171', border: 'none', fontWeight: 500 }}>
          Complete
        </Badge>
      );
    case DisplayStatus.FAILED: {
      const badge = (
        <Badge
          variant="negative"
          style={{ background: '#FDECEA', color: '#C0392B', border: 'none', fontWeight: 500 }}>
          Failed
        </Badge>
      );
      return errorMessage ? (
        <Tooltip content={errorMessage} placement="top">
          {badge}
        </Tooltip>
      ) : (
        badge
      );
    }
    case DisplayStatus.EXPIRED:
      return (
        <Badge
          variant="secondary"
          style={{ background: '#F0F2F5', color: '#536171', border: 'none', fontWeight: 500 }}>
          Expired
        </Badge>
      );
  }
}

export function RunRow({ run, spaceId, webappHost, onReview, onRetry }: RunRowProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry(run.runId);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <TableRow>
      {/* Name */}
      <TableCell>
        <Text fontWeight="fontWeightMedium">{run.documentTitle}</Text>

        {/* Entry links for completed runs */}
        {run.displayStatus === DisplayStatus.COMPLETED &&
          run.createdEntryIds &&
          run.createdEntryIds.length > 0 && (
            <Flex gap="spacingXs" flexWrap="wrap" marginTop="spacing2Xs">
              {run.createdEntryIds.map((entryId, index) => (
                <TextLink
                  key={entryId}
                  href={`https://${webappHost}/spaces/${spaceId}/entries/${entryId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '12px' }}>
                  {run.createdEntryIds!.length === 1 ? 'View entry' : `Entry ${index + 1}`}
                </TextLink>
              ))}
            </Flex>
          )}
      </TableCell>

      {/* Created date */}
      <TableCell>
        <Text fontSize="fontSizeS" fontColor="gray600">
          {formatDate(run.startedAt)}
        </Text>
      </TableCell>

      {/* Status badge */}
      <TableCell style={{ verticalAlign: 'middle' }}>
        <StatusBadge status={run.displayStatus} errorMessage={run.errorMessage} />
      </TableCell>

      {/* Action */}
      <TableCell style={{ verticalAlign: 'middle' }}>
        {run.displayStatus === DisplayStatus.RUNNING && (
          <Flex gap="spacing2Xs" alignItems="center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: '#536171',
                  animation: `driveDotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
            <style>{`
              @keyframes driveDotBounce {
                0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
                40% { transform: translateY(-5px); opacity: 1; }
              }
            `}</style>
          </Flex>
        )}
        {run.displayStatus === DisplayStatus.NEEDS_REVIEW && (
          <Button variant="secondary" size="small" onClick={() => onReview(run.runId)}>
            Review
          </Button>
        )}
        {run.displayStatus === DisplayStatus.COMPLETED && run.createdEntryIds?.length === 1 && (
          <Button
            as="a"
            variant="secondary"
            size="small"
            href={`https://${webappHost}/spaces/${spaceId}/entries/${run.createdEntryIds[0]}`}
            target="_blank"
            rel="noopener noreferrer">
            View
          </Button>
        )}
        {(run.displayStatus === DisplayStatus.FAILED ||
          run.displayStatus === DisplayStatus.EXPIRED) && (
          <Button
            variant="secondary"
            size="small"
            onClick={() => void handleRetry()}
            isLoading={isRetrying}
            isDisabled={isRetrying}>
            Retry
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
