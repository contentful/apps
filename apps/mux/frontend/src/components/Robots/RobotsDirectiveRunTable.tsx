import { FC, Fragment, useState } from 'react';
import { Box, Flex, IconButton, Skeleton, Table, Text } from '@contentful/f36-components';
import { ChevronDownIcon, ChevronUpIcon } from '@contentful/f36-icons';
import { RobotsDirectiveRun, RobotsNodeState } from '../../util/robotsTypes';
import { workflowLabel } from '../../util/robotsCatalog';
import { EM_DASH, formatTimestamp } from '../../util/robotsFormat';
import { PendingCreateRow, runTableRows } from '../../util/robotsField';
import EmptyTableNote from './EmptyTableNote';
import PendingCreateCell from './PendingCreateCell';
import RobotsStatusBadge from './RobotsStatusBadge';

/**
 * Directive runs, one row each, expanding to the per-workflow `node_states`.
 *
 * `node_states` come back "in the order the bindings appear in the Directive's workflows", so a
 * step maps to its workflow by position and needs no lookup against the directive.
 */

interface RobotsDirectiveRunTableProps {
  runs: RobotsDirectiveRun[];
  /** Directive-run creates still pending. See `pendingCreateRows`. */
  pendingRows: PendingCreateRow[];
  onDontStart?: (requestId: string) => void;
  pointsToNote: boolean;
  directiveNames: Record<string, string>;
  /** Still reading the runs for the first time, so no runs is not yet an answer. */
  isLoading?: boolean;
}

const COLUMNS = ['Directive', 'Status', 'Started', 'Steps'];

const nodeDetail = (node: RobotsNodeState): string => {
  if (node.reason) return node.reason;
  if (node.source_workflows?.length) return `Waiting on ${node.source_workflows.join(', ')}`;
  return EM_DASH;
};

const NodeStateRows: FC<{ nodeStates: RobotsNodeState[] }> = ({ nodeStates }) => (
  <Table verticalAlign="middle">
    <Table.Head>
      <Table.Row>
        <Table.Cell>Workflow</Table.Cell>
        <Table.Cell>Status</Table.Cell>
        <Table.Cell>Detail</Table.Cell>
      </Table.Row>
    </Table.Head>
    <Table.Body>
      {nodeStates.map((node, index) => (
        <Table.Row key={node.job_id ?? node.reference_id ?? index}>
          <Table.Cell>
            {node.workflow_name
              ? workflowLabel(node.workflow_name)
              : node.reference_id ?? `Step ${index + 1}`}
          </Table.Cell>
          <Table.Cell>
            <RobotsStatusBadge kind="node" status={node.status} />
          </Table.Cell>
          <Table.Cell>{nodeDetail(node)}</Table.Cell>
        </Table.Row>
      ))}
    </Table.Body>
  </Table>
);

const RobotsDirectiveRunTable: FC<RobotsDirectiveRunTableProps> = ({
  runs,
  pendingRows,
  onDontStart,
  pointsToNote,
  directiveNames,
  isLoading = false,
}) => {
  const [expandedId, setExpandedId] = useState<string | undefined>();

  const head = (
    <Table.Head>
      <Table.Row>
        {COLUMNS.map((column) => (
          <Table.Cell key={column}>{column}</Table.Cell>
        ))}
      </Table.Row>
    </Table.Head>
  );

  const rows = runTableRows(pendingRows, runs);
  const nameOf = (directiveId?: string) =>
    directiveNames[directiveId ?? ''] ?? directiveId ?? EM_DASH;

  if (rows.length === 0 && isLoading) {
    return (
      <Box marginBottom="spacingM">
        <Table data-testid="robots_directive_run_table_loading" verticalAlign="middle">
          {head}
          <Table.Body>
            <Skeleton.Row rowCount={1} columnCount={COLUMNS.length} />
          </Table.Body>
        </Table>
      </Box>
    );
  }

  if (rows.length === 0) {
    return <EmptyTableNote>No directive runs for this video yet.</EmptyTableNote>;
  }

  return (
    <Box marginBottom="spacingM">
      {/* F36 tables align cells to the top by default, which leaves a text cell riding above the
          taller expand button beside it. */}
      <Table data-testid="robots_directive_run_table" verticalAlign="middle">
        {head}
        <Table.Body>
          {rows.map(({ key, pending, item: run }) => {
            if (pending) {
              // Its Steps cell carries its status: there are no steps, and nothing to expand.
              return (
                <Table.Row key={key}>
                  <Table.Cell isWordBreak>
                    <Text>
                      {pending.pending.kind === 'directive-run' &&
                        nameOf(pending.pending.directiveId)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <RobotsStatusBadge kind="create" status={pending.phase} />
                  </Table.Cell>
                  <Table.Cell>Requested {formatTimestamp(pending.pending.requestedAt)}</Table.Cell>
                  <Table.Cell>
                    <PendingCreateCell
                      row={pending}
                      onDontStart={onDontStart}
                      pointsToNote={pointsToNote}
                    />
                  </Table.Cell>
                </Table.Row>
              );
            }

            const isExpanded = expandedId === run.run_id;
            const nodeStates = run.node_states ?? [];

            return (
              <Fragment key={key}>
                <Table.Row>
                  {/* A directive with no name shows its id, which has no spaces to wrap at. */}
                  <Table.Cell isWordBreak>
                    <Text>{nameOf(run.directive_id)}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <RobotsStatusBadge kind="run" status={run.status} />
                  </Table.Cell>
                  <Table.Cell>{formatTimestamp(run.started_at)}</Table.Cell>
                  <Table.Cell>
                    <Flex alignItems="center" gap="spacingXs">
                      <IconButton
                        variant="transparent"
                        aria-label={isExpanded ? 'Hide steps' : 'Show steps'}
                        isDisabled={nodeStates.length === 0}
                        icon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        onClick={() => setExpandedId(isExpanded ? undefined : run.run_id)}
                      />
                      <Text>{nodeStates.length}</Text>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
                {isExpanded && (
                  <Table.Row>
                    <Table.Cell colSpan={4}>
                      <NodeStateRows nodeStates={nodeStates} />
                    </Table.Cell>
                  </Table.Row>
                )}
              </Fragment>
            );
          })}
        </Table.Body>
      </Table>
    </Box>
  );
};

export default RobotsDirectiveRunTable;
