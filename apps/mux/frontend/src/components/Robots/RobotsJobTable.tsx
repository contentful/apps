import { FC } from 'react';
import { Box, Button, Skeleton, Table, Text, TextLink } from '@contentful/f36-components';
import { RobotsJob, isTerminalStatus } from '../../util/robotsTypes';
import { workflowLabel } from '../../util/robotsCatalog';
import { formatTimestamp } from '../../util/robotsFormat';
import { PendingCreateRow, jobTableRows } from '../../util/robotsField';
import EmptyTableNote from './EmptyTableNote';
import PendingCreateCell from './PendingCreateCell';
import RobotsStatusBadge from './RobotsStatusBadge';

/** The job list, following the `TrackList` table convention used for captions and audio. */

/**
 * What is known about a job's *full* record, as opposed to the six-field list summary.
 *
 * `units_consumed` only exists on `GET /robots/v0/jobs/{workflow}/{id}`, and that read is bounded
 * (see `jobsNeedingDetail`), so a blank cell has three causes the editor cannot tell apart unless
 * the column says which one it is.
 */
export type RobotsJobDetailState =
  /** The full record is in hand. Anything missing from it is missing because Mux did not send it. */
  | 'loaded'
  /** The read was attempted and failed — a purged job, a proxy error. Asking again is pointless. */
  | 'unreadable'
  /** Never asked. Past the background window, or not its turn yet. */
  | 'unread';

interface RobotsUnitsCell {
  label: string;
  /** True when one detail read would turn `label` into an actual number. */
  isLoadable: boolean;
}

/**
 * What the Units column says.
 *
 * There is no unqualified em dash here: blank-because-unknown against blank-because-empty is the
 * ambiguity that has produced several bugs on this feature, so every state says which one it is.
 * `Not charged` comes first, ahead of any number, because it is knowable without reading anything
 * — Mux does not bill a job that errored or was cancelled, and the Actions column says the same.
 */
export function unitsCell(job: RobotsJob, detail: RobotsJobDetailState): RobotsUnitsCell {
  if (job.status === 'errored' || job.status === 'cancelled') {
    return { label: 'Not charged', isLoadable: false };
  }
  if (typeof job.units_consumed === 'number') {
    return { label: String(job.units_consumed), isLoadable: false };
  }
  if (!isTerminalStatus(job.status)) return { label: 'Not counted yet', isLoadable: false };
  if (detail === 'unreadable') return { label: 'Unavailable', isLoadable: false };
  // We read the whole job and it carried no count. Not the same as never having looked.
  if (detail === 'loaded') return { label: 'Not reported', isLoadable: false };
  return { label: 'Not loaded', isLoadable: true };
}

interface RobotsJobTableProps {
  jobs: RobotsJob[];
  /** Job creates still pending, shown as rows until each becomes its job. See `pendingCreateRows`. */
  pendingRows: PendingCreateRow[];
  /** Withdraws a create still waiting behind a publish. Absent for someone who cannot run Robots. */
  onDontStart?: (requestId: string) => void;
  /** Whether an unconfirmed row points at the note above the table, which only runners see. */
  pointsToNote: boolean;
  /** Ids whose full record has been read. See `RobotsJobDetailState`. */
  detailedJobIds: Set<string>;
  /** Ids whose detail read was attempted and failed. */
  unreadableJobIds: Set<string>;
  /** Absent for someone who cannot run Robots, and then no row offers Cancel. See ADR-0016. */
  onCancel?: (job: RobotsJob) => void;
  onViewOutput: (job: RobotsJob) => void;
  /** Reads one job's full record, for a row the background pass never reached. */
  onLoadDetail: (job: RobotsJob) => void;
  /** Job ids with a cancel in flight. */
  cancellingIds: string[];
  /** Job ids with an on-demand detail read in flight. */
  loadingDetailIds: string[];
  /** Job ids the background pass will read, whose Units are therefore on their way. */
  pendingDetailIds?: Set<string>;
  /** The list itself has not arrived: the rows are placeholders, and nothing is claimed empty. */
  isLoading?: boolean;
}

const COLUMNS = ['Workflow', 'Status', 'Started', 'Units', 'Actions'];

const detailState = (
  job: RobotsJob,
  detailedJobIds: Set<string>,
  unreadableJobIds: Set<string>
): RobotsJobDetailState => {
  if (detailedJobIds.has(job.id)) return 'loaded';
  if (unreadableJobIds.has(job.id)) return 'unreadable';
  return 'unread';
};

interface JobActionsProps {
  job: RobotsJob;
  isCancelling: boolean;
  onCancel?: (job: RobotsJob) => void;
  onViewOutput: (job: RobotsJob) => void;
}

/**
 * A missing button reads as a rendering bug, so a row with no action to offer says what it would
 * have shown instead.
 */
const JobActions: FC<JobActionsProps> = ({ job, isCancelling, onCancel, onViewOutput }) => {
  if (job.status === 'pending' || job.status === 'processing') {
    if (!onCancel) {
      return (
        <Text fontColor="gray600" fontSize="fontSizeS" data-testid={`robots-running-${job.id}`}>
          Output appears when it finishes
        </Text>
      );
    }
    return (
      <Button
        size="small"
        variant="negative"
        isDisabled={isCancelling}
        isLoading={isCancelling}
        onClick={() => onCancel(job)}>
        Cancel
      </Button>
    );
  }

  if (job.status === 'cancelled') {
    // A cancelled job stopped before it produced anything, so the modal could only ever say so —
    // after paying a round trip to find out.
    return (
      <Text fontColor="gray600" fontSize="fontSizeS" data-testid={`robots-no-output-${job.id}`}>
        Nothing to view — cancelled before it produced output
      </Text>
    );
  }

  return (
    <Button size="small" variant="secondary" onClick={() => onViewOutput(job)}>
      View output
    </Button>
  );
};

const RobotsJobTable: FC<RobotsJobTableProps> = ({
  jobs,
  pendingRows,
  onDontStart,
  pointsToNote,
  detailedJobIds,
  unreadableJobIds,
  onCancel,
  onViewOutput,
  onLoadDetail,
  cancellingIds,
  loadingDetailIds,
  pendingDetailIds,
  isLoading = false,
}) => {
  const head = (
    <Table.Head>
      <Table.Row>
        {COLUMNS.map((column) => (
          <Table.Cell key={column}>{column}</Table.Cell>
        ))}
      </Table.Row>
    </Table.Head>
  );

  if (isLoading) {
    return (
      <Box marginBottom="spacingM">
        <Table data-testid="robots_job_table_loading" verticalAlign="middle">
          {head}
          <Table.Body>
            <Skeleton.Row rowCount={3} columnCount={COLUMNS.length} />
          </Table.Body>
        </Table>
      </Box>
    );
  }

  const rows = jobTableRows(pendingRows, jobs);
  if (rows.length === 0) {
    return <EmptyTableNote>No Robots jobs have run on this video yet.</EmptyTableNote>;
  }

  return (
    <Box marginBottom="spacingM">
      {/* Middle, not F36's default top: the action button is taller than the text beside it. */}
      <Table data-testid="robots_job_table" verticalAlign="middle">
        {head}
        <Table.Body>
          {rows.map(({ key, pending, item: job }) => {
            if (pending) {
              // No Mux id, so nothing on it implies a job exists: no output, Cancel or Units read.
              return (
                <Table.Row key={key}>
                  <Table.Cell>
                    <Text>
                      {pending.pending.kind === 'job' && workflowLabel(pending.pending.workflow)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <RobotsStatusBadge kind="create" status={pending.phase} />
                  </Table.Cell>
                  <Table.Cell>Requested {formatTimestamp(pending.pending.requestedAt)}</Table.Cell>
                  <Table.Cell>
                    <Text>Not counted yet</Text>
                  </Table.Cell>
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

            const units = unitsCell(job, detailState(job, detailedJobIds, unreadableJobIds));
            // The background read is coming, so this is loading, not "Not loaded".
            const isLoadingDetail =
              loadingDetailIds.includes(job.id) ||
              (units.isLoadable && !!pendingDetailIds?.has(job.id));

            return (
              <Table.Row key={key}>
                <Table.Cell>
                  <Text>{workflowLabel(job.workflow)}</Text>
                  {/* No failure reason here: the status says it errored, View output says why. */}
                </Table.Cell>
                <Table.Cell>
                  <RobotsStatusBadge kind="job" status={job.status} />
                </Table.Cell>
                <Table.Cell>{formatTimestamp(job.created_at)}</Table.Cell>
                <Table.Cell>
                  {units.isLoadable ? (
                    // A row past the background window says "Not loaded" rather than an em dash,
                    // and offers the one read that answers it — so request volume tracks how many
                    // rows somebody cares about, not how long this asset's history is.
                    <TextLink
                      as="button"
                      variant="primary"
                      isDisabled={isLoadingDetail}
                      data-testid={`robots-load-units-${job.id}`}
                      onClick={() => onLoadDetail(job)}>
                      {isLoadingDetail ? 'Loading…' : units.label}
                    </TextLink>
                  ) : (
                    <Text data-testid={`robots-units-${job.id}`}>{units.label}</Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <JobActions
                    job={job}
                    isCancelling={cancellingIds.includes(job.id)}
                    onCancel={onCancel}
                    onViewOutput={onViewOutput}
                  />
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </Box>
  );
};

export default RobotsJobTable;
