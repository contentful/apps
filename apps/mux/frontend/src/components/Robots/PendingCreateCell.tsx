import { FC } from 'react';
import { Button, Flex, Text } from '@contentful/f36-components';
import { PendingCreateRow } from '../../util/robotsField';

/**
 * The last cell of a pending row, in either table: its status in a few words. The explanation, and
 * the one action that clears an unconfirmed create, are in the note above the table (ADR-0003).
 */
const PendingCreateCell: FC<{
  row: PendingCreateRow;
  /** Only while the placeholder waits behind a publish, and only for someone who can run Robots. */
  onDontStart?: (requestId: string) => void;
  /** True for someone who can run Robots, who is the one the note is shown to. */
  pointsToNote: boolean;
}> = ({ row, onDontStart, pointsToNote }) => {
  const testId = `robots-pending-${row.pending.requestId}`;

  if (row.phase === 'waiting-for-publish') {
    return (
      <Flex alignItems="center" gap="spacingS" flexWrap="wrap">
        <Text fontColor="gray600" fontSize="fontSizeS" data-testid={testId}>
          Starts after the publish finishes
        </Text>
        {onDontStart && (
          <Button
            size="small"
            variant="secondary"
            onClick={() => onDontStart(row.pending.requestId)}>
            Don’t start
          </Button>
        )}
      </Flex>
    );
  }

  return (
    <Text fontColor="gray600" fontSize="fontSizeS" data-testid={testId}>
      {row.phase === 'unconfirmed' && pointsToNote ? 'See the note above' : 'Waiting for Mux'}
    </Text>
  );
};

export default PendingCreateCell;
