import { FC } from 'react';
import { Box, Button, Note } from '@contentful/f36-components';
import { PendingCreateRow } from '../../util/robotsField';
import { workflowLabel } from '../../util/robotsCatalog';
import { formatTimeOfDay } from '../../util/robotsFormat';

/**
 * The one place that explains an unconfirmed create and offers the way out. The decision can cost
 * money, so it is asked with the situation explained, and it names the runs it would clear, which
 * are exactly the rows marked Not confirmed. See ADR-0003.
 */
const RobotsUnconfirmedNote: FC<{
  /** The unconfirmed rows of one table. Renders nothing when there are none. */
  rows: PendingCreateRow[];
  directiveNames: Record<string, string>;
  onClear: () => void;
  testId: string;
}> = ({ rows, directiveNames, onClear, testId }) => {
  if (rows.length === 0) return null;
  const [only] = rows;
  const isDirective = only.pending.kind === 'directive-run';

  let text: string;
  if (rows.length > 1) {
    text = isDirective
      ? `Mux has not confirmed ${rows.length} directive runs on this video. They may already be running several billable workflows, so nothing was retried. If they are still going, Mux refuses another run of those directives on this video.`
      : `Mux has not confirmed ${rows.length} runs on this video. They may already be running and billing, so nothing was retried. If they are still going, Mux refuses identical runs.`;
  } else if (only.pending.kind === 'directive-run') {
    const name = directiveNames[only.pending.directiveId] ?? only.pending.directiveId;
    text = `Mux has not confirmed the run of ${name} requested at ${formatTimeOfDay(
      only.pending.requestedAt
    )}. It may already be running several billable workflows, so nothing was retried. If it is still going, Mux refuses another run of this directive on this video.`;
  } else {
    text = `Mux has not confirmed the ${workflowLabel(
      only.pending.workflow
    )} run requested at ${formatTimeOfDay(
      only.pending.requestedAt
    )}. It may already be running and billing, so nothing was retried. If it is still going, Mux refuses an identical run.`;
  }

  return (
    <Box marginBottom="spacingM">
      <Note variant="warning" data-testid={testId}>
        {text}
        <Box marginTop="spacingS">
          <Button size="small" variant="secondary" onClick={onClear}>
            Nothing is running — let me try again
          </Button>
        </Box>
      </Note>
    </Box>
  );
};

export default RobotsUnconfirmedNote;
