import { FC, ReactElement, ReactNode, useEffect, useState } from 'react';
import {
  Box,
  CopyButton,
  Flex,
  Grid,
  Modal,
  Note,
  Spinner,
  Tabs,
  Text,
} from '@contentful/f36-components';
import { RobotsJob, robotsJobErrorMessage } from '../../util/robotsTypes';
import FieldModal from '../FieldModal';
import { workflowLabel } from '../../util/robotsCatalog';
import { formatTimestamp } from '../../util/robotsFormat';
import { MuxApiService } from '../../util/muxApi';
import RobotsJsonBlock, { prettyJson } from './RobotsJsonBlock';
import { OUTPUT_VIEWS } from './RobotsOutputViews';
import { RobotsJobDetailState, unitsCell } from './RobotsJobTable';
import RobotsStatusBadge from './RobotsStatusBadge';

export { prettyJson };

/**
 * Shows a finished job's output, two ways.
 *
 * **Result** is shaped per workflow, and falls back to the raw JSON for anything a view cannot
 * read. **Raw JSON** is the whole job, for every workflow — not just `outputs`, because both of
 * the bugs it exists to shorten were only diagnosable from outside `outputs`: a list summary
 * carrying no `outputs` at all looks identical to an empty result until you can see the key is
 * missing rather than empty, and an empty `audible_narrative` is explained by `parameters`.
 */

interface RobotsOutputViewerProps {
  /** The row the editor clicked. Comes from the job *list*, so it has no `outputs`. */
  job?: RobotsJob;
  muxApi?: MuxApiService;
  /**
   * Hands the fetched record back to the caller. This modal is the one place a job's full record
   * is read on an interaction rather than on a schedule, and the background read it complements is
   * capped — so for a row past that cap this fetch is the only detail that will ever exist.
   */
  onLoaded?: (job: RobotsJob) => void;
  onClose: () => void;
}

/** A shaped view, or the raw JSON when the shape is not there after all. */
const shapedOrRaw = (hasContent: boolean, shaped: ReactElement, outputs: unknown): ReactElement =>
  hasContent ? (
    shaped
  ) : (
    <>
      <Note variant="warning">
        This job completed, but its output is not in the shape this view knows how to draw. The raw
        result follows.
      </Note>
      <RobotsJsonBlock value={outputs} what="this output" testId="robots-output-json" />
    </>
  );

const OutputBody: FC<{ job: RobotsJob }> = ({ job }) => {
  if (job.status === 'errored') {
    return (
      <Note variant="negative">
        {robotsJobErrorMessage(job) ?? 'This job failed without a message.'}
      </Note>
    );
  }
  if (job.status === 'cancelled') return <Note variant="neutral">This job was cancelled.</Note>;
  if (job.status !== 'completed') {
    return <Note variant="neutral">This job is still {job.status}.</Note>;
  }

  const outputs = job.outputs;
  if (!outputs || Object.keys(outputs).length === 0) {
    return (
      <Note variant="neutral">
        Mux reports this job as completed but returned no output for it.
      </Note>
    );
  }

  const view = OUTPUT_VIEWS[job.workflow];
  if (!view) {
    // Unreachable for the twelve workflows in `ROBOTS_WORKFLOWS`. It catches one Mux adds that
    // this build has never heard of, which is exactly when saying so out loud beats an
    // unlabelled block.
    return (
      <>
        <Note variant="neutral">
          This app has no shaped view for {String(job.workflow)} yet. Here is what the job returned.
        </Note>
        <RobotsJsonBlock value={outputs} what="this output" testId="robots-output-json" />
      </>
    );
  }

  return shapedOrRaw(view.hasContent(outputs), view.render(outputs), outputs);
};

/**
 * The Raw JSON tab: the whole job, for any status. A completed job with no `outputs` and one whose
 * `outputs` this build cannot read look the same from the Result tab; here they do not.
 */
const RawJobView: FC<{ job: RobotsJob }> = ({ job }) => (
  <>
    {!(job.outputs && Object.keys(job.outputs).length > 0) && (
      <Note variant="warning">
        This job came back with no outputs. Everything Mux did return for it is below.
      </Note>
    )}
    <RobotsJsonBlock value={job} what="this job" testId="robots-raw-json" />
  </>
);

/** A label and its value, centred on each other — the id's row is as tall as its copy button. */
const Fact: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <>
    <Flex as="dt" alignItems="center">
      <Text fontColor="gray600">{label}</Text>
    </Flex>
    <Flex as="dd" alignItems="center" gap="spacingXs" margin="none">
      {children}
    </Flex>
  </>
);

/**
 * The job's facts as a key/value list. The workflow is the modal's title, so it is not repeated.
 *
 * The id is truncated with a copy button beside it: it is only wanted verbatim, and at full length
 * it pushed the modal into a horizontal scroll. `minmax(0, 1fr)` is what lets it truncate rather
 * than widen its column.
 */
const JobFacts: FC<{ job: RobotsJob; units: string }> = ({ job, units }) => (
  <Grid
    as="dl"
    columns="max-content minmax(0, 1fr)"
    columnGap="spacingM"
    rowGap="spacing2Xs"
    margin="none"
    marginBottom="spacingM"
    data-testid="robots-job-facts">
    <Fact label="Status">
      <RobotsStatusBadge kind="job" status={job.status} />
    </Fact>
    <Fact label="AI units">
      <Text>{units}</Text>
    </Fact>
    <Fact label="Started">
      <Text>{formatTimestamp(job.created_at)}</Text>
    </Fact>
    <Fact label="Job ID">
      {/* Direct children of the value cell, not wrapped: a truncating flex item has to be the
          cell's own child, or the wrapper's minimum width is the id's full length again. */}
      <Text isTruncated title={job.id} data-testid="robots-job-id">
        {job.id}
      </Text>
      <CopyButton
        value={job.id}
        size="small"
        label="Copy job ID"
        tooltipText="Copy job ID"
        tooltipCopiedText="Copied"
      />
    </Fact>
  </Grid>
);

/**
 * What one fetch came back with, and **which job it was about**.
 *
 * The id is load-bearing. This used to be three independent pieces of state — `detailed`,
 * `isLoading`, `error` — and only the first was tied to the job on screen, which is how the
 * reported permanent spinner worked: a cancelled fetch skipped the `finally` that cleared the
 * flag, and nothing was left to re-run the effect that would take it down. There is no flag any
 * more; `isLoading` is derived.
 */
interface ViewerResult {
  jobId: string;
  /** The fetched record. Absent when the fetch failed, or Mux answered with no job at all. */
  job?: RobotsJob;
  message?: string;
}

const RobotsOutputViewer: FC<RobotsOutputViewerProps> = ({ job, muxApi, onLoaded, onClose }) => {
  const [result, setResult] = useState<ViewerResult | undefined>();

  const jobId = job?.id;
  const workflow = job?.workflow;
  /**
   * Whether the caller already holds what this modal would fetch: `outputs` and `errors` exist
   * only on the single-job GET, so either one means the full record is in hand — a create
   * response, or the panel's cache. Terminal detail never changes, and for an errored job
   * re-reading it is a risk as well as a cost: this is the only place its reason is shown, and a
   * failed re-read would put its own error there instead.
   */
  const isHeldInFull = !!job?.outputs || job?.errors !== undefined;

  /**
   * Fetch the job in full when the modal opens. The single-job GET is the only place `outputs`
   * lives, and fetching it here means we only pay for the jobs someone opens.
   *
   * Keyed on what the fetch depends on — id, workflow, whether the record is already in hand —
   * rather than on the identity of `job`, which the panel rebuilds on every poll tick. Keying on
   * identity would cancel and restart this fetch on a six-second cadence.
   */
  useEffect(() => {
    if (!jobId || !workflow || isHeldInFull) return;

    if (!muxApi) {
      setResult({ jobId, message: 'The Mux client is not ready yet.' });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await muxApi.getRobotsJob(workflow, jobId);
        // A later run owns the state now; there is no flag left behind by saying nothing here.
        if (cancelled) return;
        setResult({ jobId, job: response.data });
        // The caller keeps the record, so the row behind this modal stops saying it never asked.
        if (response.data) onLoaded?.(response.data);
      } catch (fetchError) {
        if (cancelled) return;
        setResult({
          jobId,
          message:
            fetchError instanceof Error ? fetchError.message : 'Could not load this job from Mux.',
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [jobId, workflow, isHeldInFull, muxApi, onLoaded]);

  /** A result carrying another id belongs to the job the modal showed before this one. */
  const settled = result?.jobId === jobId ? result : undefined;
  /** Prefer the fetched job, but never render nothing: the summary has status and workflow. */
  const shown = settled?.job ?? job;
  const error = settled?.message;
  /** Derived, never latched, so a cancelled request leaves nothing to get stuck on. */
  const isLoading = !!jobId && !isHeldInFull && !settled;
  /** The job table's vocabulary for the same cell, so the two never disagree about a job. */
  const detail: RobotsJobDetailState =
    isHeldInFull || settled?.job ? 'loaded' : error ? 'unreadable' : 'unread';

  return (
    <FieldModal isShown={!!job} onClose={onClose} size="large">
      {() =>
        shown ? (
          <>
            <Modal.Header title={workflowLabel(shown.workflow)} onClose={onClose} />
            <Modal.Content>
              <JobFacts
                job={shown}
                units={isLoading ? 'Loading…' : unitsCell(shown, detail).label}
              />
              {/*
                Loading and error stay whole-modal states rather than becoming extra tabs: neither
                has a payload yet, so a Raw JSON tab beside them could only show the summary row
                the editor clicked — and a summary rendered as if it were the result is the
                original bug on this feature, not a diagnostic.
              */}
              {isLoading ? (
                <Flex alignItems="center" gap="spacingS">
                  <Spinner size="small" />
                  <Text>Loading the result from Mux…</Text>
                </Flex>
              ) : error ? (
                <Note variant="negative">{error}</Note>
              ) : (
                <Tabs defaultTab="result">
                  <Tabs.List>
                    <Tabs.Tab panelId="result">Result</Tabs.Tab>
                    <Tabs.Tab panelId="raw">Raw JSON</Tabs.Tab>
                  </Tabs.List>
                  <Tabs.Panel id="result">
                    <Box marginTop="spacingM">
                      <OutputBody job={shown} />
                    </Box>
                  </Tabs.Panel>
                  <Tabs.Panel id="raw">
                    <Box marginTop="spacingM">
                      <RawJobView job={shown} />
                    </Box>
                  </Tabs.Panel>
                </Tabs>
              )}
            </Modal.Content>
          </>
        ) : null
      }
    </FieldModal>
  );
};

export default RobotsOutputViewer;
