import { FC, useEffect, useMemo, useState } from 'react';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import {
  Badge,
  Box,
  Button,
  Modal,
  Note,
  Paragraph,
  Select,
  Table,
  Text,
} from '@contentful/f36-components';
import {
  ApplySelection,
  RobotsOutputCandidate,
  applyOutputsToEntry,
  buildOutputCandidates,
  currentFieldValue,
  defaultTargetFieldId,
  entryFieldOptions,
  formatFieldValue,
  matchesGeneratedValue,
  preferredTargetFieldId,
  wouldOverwrite,
} from '../../util/robotsEntryMapping';
import { RobotsOutputs } from '../../util/robotsTypes';
import FieldModal from '../FieldModal';

/**
 * "Apply summary" — and the mapping UI, in one dialog.
 *
 * The mapping is not configured anywhere: the target dropdown is pre-filled by convention and
 * filtered to type-compatible fields, and the generated value sits beside the current one so the
 * editor can see exactly what a row would replace.
 *
 * **One control per row, and it is the dropdown.** There used to be a checkbox as well, which made
 * two controls for a single decision and two ways to express "skip this one". Choosing a target is
 * now the whole of the decision, and `Do not apply` is how a row is skipped — so a row that would
 * replace existing content opens with no target rather than with a target it will not use.
 */

interface ApplyToEntryModalProps {
  isShown: boolean;
  onClose: () => void;
  sdk: FieldExtensionSDK;
  outputs?: RobotsOutputs;
}

/**
 * Column widths, as percentages of the dialog.
 *
 * The dialog is as wide as the entry editor's field area, which is not wide. Left to size
 * themselves the two value columns take everything their text asks for, and the target dropdown —
 * an F36 `Select`, which is `width: 100%` and therefore contributes no minimum of its own —
 * collapses to about one character. Naming every column's share is what stops that.
 */
const COLUMN_WIDTH = {
  output: '15%',
  target: '33%',
  current: '26%',
  next: '26%',
} as const;

const ApplyToEntryModal: FC<ApplyToEntryModalProps> = ({ isShown, onClose, sdk, outputs }) => {
  const locale = sdk.locales?.default ?? 'en-US';
  const candidates = useMemo(
    () => (isShown ? buildOutputCandidates(sdk, outputs) : []),
    [isShown, sdk, outputs]
  );
  const fieldOptions = useMemo(() => (isShown ? entryFieldOptions(sdk) : []), [isShown, sdk]);
  const fieldNames = useMemo(
    () => Object.fromEntries(fieldOptions.map((field) => [field.id, field.name])),
    [fieldOptions]
  );

  /** Output key → chosen field id. `''` is a row that will not be applied. */
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (!isShown) return;
    setTargets(
      Object.fromEntries(
        candidates.map((candidate) => [candidate.key, defaultTargetFieldId(sdk, candidate, locale)])
      )
    );
  }, [isShown, candidates, sdk, locale]);

  const handleApply = async () => {
    const selections: ApplySelection[] = candidates
      .map((candidate) => ({ candidate, fieldId: targets[candidate.key] ?? '' }))
      .filter(({ fieldId }) => !!fieldId);

    if (selections.length === 0) {
      onClose();
      return;
    }

    setIsApplying(true);
    try {
      const result = await applyOutputsToEntry(sdk, selections, locale);
      if (result.applied.length > 0) {
        sdk.notifier.success(
          `Applied ${result.applied.length} generated ${
            result.applied.length === 1 ? 'value' : 'values'
          } to this entry.`
        );
      }
      for (const failure of result.failed) {
        sdk.notifier.error(
          `Could not write ${fieldNames[failure.fieldId] ?? failure.fieldId}: ${failure.message}`
        );
      }
      onClose();
    } finally {
      setIsApplying(false);
    }
  };

  const selectedCount = candidates.filter((candidate) => !!targets[candidate.key]).length;

  return (
    <FieldModal isShown={isShown} onClose={onClose} size="large">
      {() => (
        <>
          <Modal.Header title="Apply summary to this entry" onClose={onClose} />
          <Modal.Content>
            {candidates.length === 0 ? (
              <Note variant="neutral">
                There is no generated summary to apply yet. Run the Summarize workflow first.
              </Note>
            ) : (
              <>
                <Paragraph>
                  Pick a target field for each output — leave it on <strong>Do not apply</strong> to
                  skip one. Writing to the <strong>{locale}</strong> locale. Nothing is saved to Mux
                  — these are your own entry fields, and the change stays a draft until you publish.
                </Paragraph>
                <Table>
                  <Table.Head>
                    <Table.Row>
                      <Table.Cell width={COLUMN_WIDTH.output}>Output</Table.Cell>
                      <Table.Cell width={COLUMN_WIDTH.target}>Target field</Table.Cell>
                      <Table.Cell width={COLUMN_WIDTH.current}>Current value</Table.Cell>
                      <Table.Cell width={COLUMN_WIDTH.next}>New value</Table.Cell>
                    </Table.Row>
                  </Table.Head>
                  <Table.Body>
                    {candidates.map((candidate) => (
                      <CandidateRow
                        key={candidate.key}
                        candidate={candidate}
                        fieldId={targets[candidate.key] ?? ''}
                        fieldNames={fieldNames}
                        locale={locale}
                        sdk={sdk}
                        onChange={(nextFieldId) =>
                          setTargets((previous) => ({
                            ...previous,
                            [candidate.key]: nextFieldId,
                          }))
                        }
                      />
                    ))}
                  </Table.Body>
                </Table>
                {candidates.some((candidate) => candidate.compatibleFieldIds.length === 0) && (
                  <Box marginTop="spacingM">
                    <Note variant="warning">
                      Some outputs have no field on this content type that could hold them. Add a
                      short-text, long-text, rich-text or list-of-text field to map them.
                    </Note>
                  </Box>
                )}
              </>
            )}
          </Modal.Content>
          <Modal.Controls>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="positive"
              isDisabled={selectedCount === 0 || isApplying}
              isLoading={isApplying}
              onClick={handleApply}>
              Apply {selectedCount > 0 ? selectedCount : ''}
            </Button>
          </Modal.Controls>
        </>
      )}
    </FieldModal>
  );
};

interface CandidateRowProps {
  candidate: RobotsOutputCandidate;
  /** The chosen field, or `''` for "do not apply". */
  fieldId: string;
  fieldNames: Record<string, string>;
  locale: string;
  sdk: FieldExtensionSDK;
  onChange: (nextFieldId: string) => void;
}

const CandidateRow: FC<CandidateRowProps> = ({
  candidate,
  fieldId,
  fieldNames,
  locale,
  sdk,
  onChange,
}) => {
  if (candidate.compatibleFieldIds.length === 0) {
    return (
      <Table.Row>
        <Table.Cell>{candidate.label}</Table.Cell>
        <Table.Cell colSpan={3}>
          <Text fontColor="gray600">No compatible field on this content type.</Text>
        </Table.Cell>
      </Table.Row>
    );
  }

  return (
    <Table.Row>
      <Table.Cell>{candidate.label}</Table.Cell>
      <Table.Cell>
        <Select
          id={`robots-apply-target-${candidate.key}`}
          aria-label={`Target field for ${candidate.label}`}
          value={fieldId}
          onChange={(event) => onChange((event.target as HTMLSelectElement).value)}>
          <Select.Option value="">Do not apply</Select.Option>
          {candidate.compatibleFieldIds.map((id) => (
            <Select.Option key={id} value={id}>
              {fieldNames[id] ?? id}
            </Select.Option>
          ))}
        </Select>
      </Table.Cell>
      <Table.Cell>
        <CurrentValueCell
          candidate={candidate}
          fieldId={fieldId}
          fieldNames={fieldNames}
          locale={locale}
          sdk={sdk}
        />
      </Table.Cell>
      <Table.Cell>
        <Text fontSize="fontSizeS">{formatFieldValue(candidate.value)}</Text>
      </Table.Cell>
    </Table.Row>
  );
};

/**
 * What the chosen field holds today — or, for a row with no target, why it has none.
 *
 * That second case is the whole reason this is its own component. Without the checkbox there is
 * nothing on an unfilled row to say whether the dialog found no home for the output or declined a
 * home it found, and "declined because that field already says something" is exactly what the
 * editor needs to know to overrule it.
 */
const CurrentValueCell: FC<Omit<CandidateRowProps, 'onChange'>> = ({
  candidate,
  fieldId,
  fieldNames,
  locale,
  sdk,
}) => {
  if (!fieldId) {
    const declined = preferredTargetFieldId(candidate);
    const declinedValue = declined ? currentFieldValue(sdk, declined, locale) : undefined;
    // Three states, not two. A field holding exactly this generated value is not a field with
    // something in the way — it is this row, already done, and the honest thing to say is that
    // there is nothing to do rather than to invite the editor to overwrite it with itself.
    if (matchesGeneratedValue(declinedValue, candidate.value)) {
      return (
        <Text fontColor="gray600">
          {fieldNames[declined] ?? declined} already holds this value. Nothing to apply.
        </Text>
      );
    }
    return wouldOverwrite(declinedValue) ? (
      <Text fontColor="gray600">
        {fieldNames[declined] ?? declined} already has content. Pick it as the target to replace it.
      </Text>
    ) : (
      <Text fontColor="gray600">Not being applied.</Text>
    );
  }

  const current = currentFieldValue(sdk, fieldId, locale);
  // The same distinction on a row the editor did pick: writing this would change nothing, so
  // "Will be replaced" is not what is about to happen.
  if (matchesGeneratedValue(current, candidate.value)) {
    return <Badge variant="secondary">Already applied</Badge>;
  }
  return wouldOverwrite(current) ? (
    <>
      <Badge variant="warning">Will be replaced</Badge>
      <Box marginTop="spacingXs">
        <Text fontSize="fontSizeS">{formatFieldValue(current)}</Text>
      </Box>
    </>
  ) : (
    <Text fontColor="gray600">Empty</Text>
  );
};

export default ApplyToEntryModal;
