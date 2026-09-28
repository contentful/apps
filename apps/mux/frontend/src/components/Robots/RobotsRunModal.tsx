import { FC, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  Form,
  FormControl,
  Modal,
  Note,
  Paragraph,
  Select,
  Text,
} from '@contentful/f36-components';
import ExternalLink from '../ExternalLink';
import FieldModal from '../FieldModal';
import {
  DEFAULT_ROBOTS_WORKFLOW,
  ROBOTS_CATALOG,
  ROBOTS_CATALOG_BY_KEY,
  ROBOTS_CATEGORIES,
  RobotsAssetContext,
  availableWorkflow,
  confirmWarnings,
  defaultParamValues,
  paramsFromFormValues,
  validateParams,
  workflowUnavailableReason,
} from '../../util/robotsCatalog';
import { RobotsWorkflow } from '../../util/robotsTypes';
import { ROBOTS_PRICING_URL } from '../../util/robots';
import { Track } from '../../util/types';
import RobotsParamFields from './RobotsParamFields';

interface RobotsRunModalProps {
  isShown: boolean;
  onClose: () => void;
  /** Not awaited: the modal closes on confirm, and the job table shows the run starting. */
  onRun: (workflow: RobotsWorkflow, parameters: Record<string, unknown>) => Promise<void> | void;
  assetId: string;
  captions: Track[];
  audioTracks: Track[];
  /**
   * Whether the Mux asset is audio-only. Optional and deliberately tri-state: `undefined` means
   * the caller does not know, which must never block a run.
   */
  isAudioOnly?: boolean;
  /** Seconds, when known. Unknown blocks nothing, the same as `isAudioOnly`. */
  duration?: number;
  /** True while a create is pending on this video — Run stays disabled until it resolves. */
  isRunDisabled: boolean;
  /** Why Run is unavailable, when it is for a reason worth explaining. */
  runDisabledReason?: string;
  initialWorkflow?: RobotsWorkflow;
}

const RobotsRunModal: FC<RobotsRunModalProps> = ({
  isShown,
  onClose,
  onRun,
  assetId,
  captions,
  audioTracks,
  isAudioOnly,
  duration,
  isRunDisabled,
  runDisabledReason,
  initialWorkflow,
}) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<RobotsWorkflow>(
    initialWorkflow ?? DEFAULT_ROBOTS_WORKFLOW
  );
  const [values, setValues] = useState<Record<string, unknown>>({});
  /** The workflow the confirm step is for, so a workflow that changes under it leaves the step. */
  const [confirmedWorkflow, setConfirmedWorkflow] = useState<RobotsWorkflow | undefined>();

  // One context object for all three consumers — which fields render, which are validated, and
  // which are sent. Sharing it is the point: a field hidden because of what the asset is must not
  // then be validated or sent, exactly as with the `showWhen`s that key off another field.
  const context = useMemo<RobotsAssetContext>(
    () => ({ hasCaptions: captions.length > 0, isAudioOnly, duration }),
    [captions.length, isAudioOnly, duration]
  );

  // Derived rather than trusted, because the asset kind can arrive after the choice was made.
  const workflow = availableWorkflow(selectedWorkflow, context);
  const definition = ROBOTS_CATALOG_BY_KEY[workflow];
  const confirming = confirmedWorkflow === workflow;

  // Reset the form whenever the modal opens or the workflow changes, so options from a previous
  // workflow can never leak into the next job's parameters.
  useEffect(() => {
    setValues(defaultParamValues(definition.params));
    setConfirmedWorkflow(undefined);
  }, [definition, isShown]);

  useEffect(() => {
    if (isShown && initialWorkflow) setSelectedWorkflow(initialWorkflow);
  }, [isShown, initialWorkflow]);

  // Keep the fallback once it has happened, rather than bringing the old choice back if the asset
  // kind goes unknown again.
  useEffect(() => {
    if (selectedWorkflow !== workflow) setSelectedWorkflow(workflow);
  }, [selectedWorkflow, workflow]);

  const errors = useMemo(
    () => validateParams(definition, values, context),
    [definition, values, context]
  );

  // What the editor is about to arm, as opposed to what the workflow always does. `notes` are the
  // second; these are keyed on the value they warn about.
  const warnings = useMemo(
    () => confirmWarnings(definition, values, context),
    [definition, values, context]
  );

  const handleChange = (name: string, value: unknown) => {
    setValues((previous) => ({ ...previous, [name]: value }));
  };

  const handleContinue = () => {
    // Belt and braces: the button below is disabled on the same condition, and this is what
    // stops a keyboard or programmatic activation getting past it.
    if (errors.length > 0) return;
    setConfirmedWorkflow(workflow);
  };

  const handleConfirm = () => {
    void onRun(workflow, paramsFromFormValues(definition, assetId, values, context));
    onClose();
  };

  return (
    <FieldModal isShown={isShown} onClose={onClose} size="large">
      {() => (
        <>
          <Modal.Header
            title={confirming ? 'Confirm this run' : 'Run a Robots workflow'}
            onClose={onClose}
          />
          <Modal.Content>
            {confirming ? (
              <>
                {/* CF 4: nothing runs without an explicit confirm that names the workflow and
                    links pricing. Robots is billed per AI unit, and the editor is the one
                    spending them. */}
                <Paragraph>
                  This will run <strong>{definition.label}</strong> on this video and consume Mux AI
                  units from your account.
                </Paragraph>
                <Paragraph>
                  Robots is billed per AI unit. The first 100,000 units each month are free —{' '}
                  <ExternalLink href={ROBOTS_PRICING_URL}>see pricing</ExternalLink>.
                </Paragraph>
                {definition.producesTrack && (
                  <Note variant="neutral">
                    The result is attached to the Mux video, so it works in your players straight
                    away. It also lands in this entry as an unpublished change until you publish.
                  </Note>
                )}
                {(definition.notes ?? []).map((note) => (
                  <Box key={note} marginTop="spacingS">
                    <Note variant="warning">{note}</Note>
                  </Box>
                ))}
                {/* Last, and `negative` rather than `warning`: these are the consequences of what
                    the editor chose on the previous screen, and the reason the confirm step is
                    worth more than a checkbox. Below the pricing line so the run's cost and its
                    damage are read together. */}
                {warnings.map((warning) => (
                  <Box key={warning.title} marginTop="spacingS">
                    <Note
                      variant="negative"
                      title={warning.title}
                      data-testid="robots-confirm-warning">
                      {warning.body}
                    </Note>
                  </Box>
                ))}
              </>
            ) : (
              <Form>
                {/* The id lives on FormControl, which is what wires `htmlFor` to the control. */}
                <FormControl id="robots-workflow" marginBottom="spacingM">
                  <FormControl.Label>Workflow</FormControl.Label>
                  <Select
                    value={workflow}
                    onChange={(event) =>
                      setSelectedWorkflow(
                        (event.target as HTMLSelectElement).value as RobotsWorkflow
                      )
                    }>
                    {ROBOTS_CATEGORIES.map((category) => (
                      <optgroup key={category} label={category}>
                        {ROBOTS_CATALOG.filter((candidate) => candidate.category === category).map(
                          (candidate) => {
                            // Listed either way, so the editor can see the workflow exists and
                            // why it is not on offer for this video.
                            const unavailable = workflowUnavailableReason(candidate, context);
                            const label = unavailable
                              ? `${candidate.label} (${unavailable})`
                              : candidate.label;
                            return (
                              <Select.Option
                                key={candidate.key}
                                value={candidate.key}
                                isDisabled={!!unavailable}>
                                {label}
                              </Select.Option>
                            );
                          }
                        )}
                      </optgroup>
                    ))}
                  </Select>
                  <FormControl.HelpText>{definition.description}</FormControl.HelpText>
                </FormControl>

                <Flex gap="spacingXs" marginBottom="spacingM" flexWrap="wrap">
                  {definition.producesTrack && <Badge variant="primary">Adds a track</Badge>}
                  {definition.planRestricted && <Badge variant="warning">Plan dependent</Badge>}
                  {definition.requiresViewData && (
                    <Badge variant="secondary">Needs Mux Data views</Badge>
                  )}
                </Flex>

                {(definition.notes ?? []).map((note) => (
                  <Box key={note} marginBottom="spacingM">
                    <Note variant="neutral">{note}</Note>
                  </Box>
                ))}

                <RobotsParamFields
                  fields={definition.params}
                  values={values}
                  onChange={handleChange}
                  captions={captions}
                  audioTracks={audioTracks}
                  context={context}
                />

                {/* Shown from the moment the form can say something is wrong, not held back
                    until Continue is pressed. These are the conditions that stop the run; a
                    validation message the editor first meets on the confirm step arrives after
                    they have committed, which is where "Needs at least one replacement rule" used
                    to surface. */}
                {errors.length > 0 && (
                  <Note variant="negative" title="Fix these before running">
                    {errors.map((error) => (
                      <Text key={error} as="p" marginBottom="none">
                        {error}
                      </Text>
                    ))}
                  </Note>
                )}
              </Form>
            )}
          </Modal.Content>
          <Modal.Controls>
            {confirming ? (
              <>
                <Button variant="secondary" onClick={() => setConfirmedWorkflow(undefined)}>
                  Back
                </Button>
                <Button variant="positive" isDisabled={isRunDisabled} onClick={handleConfirm}>
                  Run {definition.label}
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                {/* Disabled while anything above says the run cannot be built, not merely
                    inert on click. A Continue that looks available and then does nothing reads
                    as a broken button, and the editor's next move is to press it again rather
                    than to scroll up and read why. */}
                <Button
                  variant="primary"
                  isDisabled={isRunDisabled || errors.length > 0}
                  onClick={handleContinue}
                  title={runDisabledReason ?? errors[0]}>
                  Continue
                </Button>
              </>
            )}
          </Modal.Controls>
        </>
      )}
    </FieldModal>
  );
};

export default RobotsRunModal;
