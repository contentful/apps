import { useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { Box, Button, Grid, Modal, Flex, Text, TextInput } from '@contentful/f36-components';
import { PlusIcon } from '@contentful/f36-icons';
import {
  type EditModalContent,
  type AddEntryWizardParams,
  type EditModalNewLocation,
} from '@types';
import type { WorkflowContentType } from '@types';
import { buildFieldOptionsForContentType, isEntryReferenceField } from '../fieldFormatting';

import {
  locationsContainer,
  selectedContentSection,
  greyCard,
  locationColumnLeft,
  newLocationScrollableList,
} from './EditModal.styles';
import { FieldSelectionDropdown } from './FieldSelectionDropdown';
import {
  AddEntryWizard,
  INITIAL_WIZARD_STATE,
  WizardStep,
  type Wizard,
  type ExistingEntryOption,
} from './AddEntryWizard';
import { WIZARD_STEPS } from './wizardSteps';
import { truncateMiddle } from '../../../../../../utils/utils';

const CURRENT_LOCATION_MAX_LENGTH = 20;
const NEW_LOCATION_MAX_LENGTH = 50;

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewModel: EditModalContent;
  title: string;
  primaryButtonLabel: string;
  additionalContent?: ReactNode;
  onConfirmPrimary?: (selections: Record<string, string[]>) => void;
  contentTypes?: WorkflowContentType[];
  existingEntries?: ExistingEntryOption[];
  onAddEntry?: (params: AddEntryWizardParams) => void;
  newEntryIndex?: number;
}

export const EditModal = ({
  isOpen,
  onClose,
  viewModel,
  title,
  primaryButtonLabel,
  additionalContent,
  onConfirmPrimary,
  contentTypes = [],
  existingEntries = [],
  onAddEntry,
  newEntryIndex = 0,
}: EditModalProps) => {
  const [wizardState, setWizard] = useState<Wizard | null>(null);
  const showWizard = wizardState !== null;

  const [selectedFieldIdsByEntry, setSelectedFieldIdsByEntry] = useState<Record<string, string[]>>(
    () => Object.fromEntries(viewModel.newLocations.map((loc) => [loc.id, loc.initialFieldIds]))
  );

  const [destinationFieldStateByEntry, setDestinationFieldStateByEntry] = useState<
    Record<string, { hasFieldOptions: boolean; hasSelectableOptions: boolean }>
  >({});

  const [entrySearch, setEntrySearch] = useState('');

  const newLocationIdsKey = viewModel.newLocations.map((loc) => loc.id).join('|');

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedFieldIdsByEntry(
      Object.fromEntries(viewModel.newLocations.map((loc) => [loc.id, loc.initialFieldIds]))
    );
    setDestinationFieldStateByEntry({});
    setEntrySearch('');
    setWizard(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from props only on open / location set change
  }, [isOpen, newLocationIdsKey]);

  const handleSelectedFieldIdsChangeForEntry = useCallback(
    (entryId: string) => (updater: (previous: string[]) => string[]) => {
      setSelectedFieldIdsByEntry((prev) => ({
        ...prev,
        [entryId]: updater(prev[entryId] ?? []),
      }));
    },
    []
  );

  const handleSelectableStateChangeForEntry = useCallback(
    (entryId: string) => (state: { hasFieldOptions: boolean; hasSelectableOptions: boolean }) => {
      setDestinationFieldStateByEntry((prev) => {
        const existing = prev[entryId];
        if (
          existing &&
          existing.hasFieldOptions === state.hasFieldOptions &&
          existing.hasSelectableOptions === state.hasSelectableOptions
        ) {
          return prev;
        }
        return { ...prev, [entryId]: state };
      });
    },
    []
  );

  const handlePrimaryAction = () => {
    onConfirmPrimary?.({ ...selectedFieldIdsByEntry });
  };

  const referenceFieldOptions = useMemo(() => {
    if (!wizardState?.contentTypeId) return [];
    const contentType = contentTypes.find((ct) => ct.sys.id === wizardState.contentTypeId);
    const referenceFields = (contentType?.fields ?? []).filter(isEntryReferenceField);
    return buildFieldOptionsForContentType({
      ...contentType,
      fields: referenceFields,
    } as typeof contentType);
  }, [wizardState?.contentTypeId, contentTypes]);

  const buildNewLocationForContentType = (contentTypeId: string): EditModalNewLocation => {
    const contentType = contentTypes.find((ct) => ct.sys.id === contentTypeId);
    return {
      id: `new-${contentTypeId}`,
      entryIndex: newEntryIndex,
      title: contentType?.name ?? contentTypeId,
      fieldOptions: buildFieldOptionsForContentType(contentType),
      fieldMappings: [],
      initialFieldIds: [],
    };
  };

  const needsReferenceFieldStep = referenceFieldOptions.length > 1;
  const wizardCtx = { needsReferenceFieldStep };

  const handleWizardNext = () => {
    if (!wizardState) return;
    setWizard({
      ...wizardState,
      step: WIZARD_STEPS[wizardState.step].next(wizardState, wizardCtx),
    });
  };

  const handleWizardBack = () => {
    if (!wizardState) return;
    setWizard({
      ...wizardState,
      step: WIZARD_STEPS[wizardState.step].back(wizardState, wizardCtx),
    });
  };

  const handleWizardSave = () => {
    if (!wizardState) return;
    onAddEntry?.({
      contentTypeId: wizardState.contentTypeId,
      isReference: wizardState.isReference ?? false,
      referenceEntryId: wizardState.isReference ? wizardState.referenceEntryId || null : null,
      referenceFieldId: wizardState.isReference
        ? wizardState.referenceFieldId || referenceFieldOptions[0]?.id || null
        : null,
      fieldIds: wizardState.selectedFieldIds,
    });
    setWizard(null);
  };

  const isWizardNextDisabled = () =>
    !wizardState || WIZARD_STEPS[wizardState.step].isDisabled(wizardState);

  const previewSectionTitle = viewModel.previewSectionTitle ?? 'Selected content';
  const previewText = (viewModel.contentPreview ?? viewModel.selectedText).trim();

  const filteredNewLocations = useMemo(() => {
    const query = entrySearch.trim().toLowerCase();
    if (!query) return viewModel.newLocations;
    return viewModel.newLocations.filter((loc) => loc.title.toLowerCase().includes(query));
  }, [viewModel.newLocations, entrySearch]);

  const isPrimaryDisabled = useMemo(() => {
    if (viewModel.newLocations.length === 0) return true;

    const allUnselectable = viewModel.newLocations.every((loc) => {
      const state = destinationFieldStateByEntry[loc.id];
      return loc.fieldOptions.length === 0 || state?.hasSelectableOptions === false;
    });
    if (allUnselectable) return true;

    const hasAnyChange = viewModel.newLocations.some((loc) => {
      const current = selectedFieldIdsByEntry[loc.id] ?? [];
      const initial = loc.initialFieldIds;
      return current.length !== initial.length || !current.every((id) => initial.includes(id));
    });

    return !hasAnyChange;
  }, [viewModel.newLocations, selectedFieldIdsByEntry, destinationFieldStateByEntry]);

  const firstCurrentLocation = viewModel.currentLocations[0];

  return (
    <Modal isShown={isOpen} onClose={onClose} size="large" shouldCloseOnOverlayClick={false}>
      {() => (
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content>
            <Grid columns="217px 1fr" rowGap="none" columnGap="none" className={locationsContainer}>
              <Grid.Item columnStart={1} columnEnd={-1}>
                <Flex
                  flexDirection="column"
                  gap="spacingXs"
                  padding="spacingS"
                  className={selectedContentSection}>
                  <Text as="p" fontWeight="fontWeightDemiBold">
                    {previewSectionTitle}
                  </Text>
                  <Box className={greyCard} padding="spacingXs">
                    {additionalContent ??
                      (viewModel.isImageContent ? (
                        <Text as="p">
                          <Text as="span">IMAGE: </Text>
                          {previewText}
                        </Text>
                      ) : (
                        <Text as="p">{previewText}</Text>
                      ))}
                  </Box>
                </Flex>
              </Grid.Item>

              {/* Current location */}
              <Grid.Item>
                <Flex
                  flexDirection="column"
                  gap="spacingS"
                  padding="spacingS"
                  className={locationColumnLeft}
                  style={{ height: '100%' }}>
                  <Flex alignItems="center" style={{ minHeight: '32px' }}>
                    <Text as="p" fontWeight="fontWeightDemiBold">
                      Current location
                    </Text>
                  </Flex>
                  {firstCurrentLocation ? (
                    <Flex
                      flexDirection="column"
                      gap="spacingXs"
                      padding="spacingXs"
                      className={greyCard}>
                      <Box>
                        <Text as="p" fontColor="gray600" fontSize="fontSizeS">
                          Content type
                        </Text>
                        <Text as="p">
                          {truncateMiddle(
                            firstCurrentLocation.contentTypeName,
                            CURRENT_LOCATION_MAX_LENGTH
                          )}
                        </Text>
                      </Box>
                      <Box>
                        <Text as="p" fontColor="gray600" fontSize="fontSizeS">
                          Entry name
                        </Text>
                        <Text as="p">
                          {truncateMiddle(
                            firstCurrentLocation.entryName,
                            CURRENT_LOCATION_MAX_LENGTH
                          )}
                        </Text>
                      </Box>
                      <Box>
                        <Text as="p" fontColor="gray600" fontSize="fontSizeS">
                          Field
                        </Text>
                        <Text as="p">
                          {truncateMiddle(firstCurrentLocation.fieldName, 15)}{' '}
                          <Text as="span" fontColor="gray500">
                            | {truncateMiddle(firstCurrentLocation.fieldType, 10)}
                          </Text>
                        </Text>
                      </Box>
                    </Flex>
                  ) : (
                    <Text as="p" fontColor="gray500" fontSize="fontSizeS">
                      No current location
                    </Text>
                  )}
                </Flex>
              </Grid.Item>

              {/* New location */}
              <Grid.Item>
                <Flex flexDirection="column" gap="spacingS" padding="spacingS">
                  {showWizard && wizardState ? (
                    <AddEntryWizard
                      state={wizardState}
                      onChange={(next) => setWizard((prev) => (prev ? { ...prev, ...next } : prev))}
                      contentTypes={contentTypes}
                      existingEntries={existingEntries}
                      referenceFieldOptions={referenceFieldOptions}
                      selectedText={viewModel.selectedText}
                      isImageContent={viewModel.isImageContent}
                      buildNewLocation={buildNewLocationForContentType}
                    />
                  ) : (
                    <>
                      <Flex
                        alignItems="center"
                        justifyContent="space-between"
                        style={{ minHeight: '32px' }}>
                        <Text as="p" fontWeight="fontWeightDemiBold">
                          New location
                        </Text>
                        {onAddEntry && (
                          <Button
                            variant="transparent"
                            size="small"
                            startIcon={<PlusIcon />}
                            onClick={() => setWizard({ ...INITIAL_WIZARD_STATE })}>
                            Add entry
                          </Button>
                        )}
                      </Flex>

                      <TextInput
                        placeholder="Search entries"
                        value={entrySearch}
                        onChange={(e) => setEntrySearch(e.target.value)}
                        aria-label="Search entries"
                      />

                      <Flex
                        flexDirection="column"
                        gap="spacingS"
                        className={newLocationScrollableList}>
                        {filteredNewLocations.map((loc) => {
                          const [contentTypePart, ...rest] = loc.title.split(': ');
                          const entryNamePart = rest.join(': ');
                          return (
                            <Flex
                              key={loc.id}
                              flexDirection="column"
                              gap="spacingXs"
                              padding="spacingXs"
                              className={greyCard}>
                              <Box>
                                <Text as="p" fontColor="gray600" fontSize="fontSizeS">
                                  Content type
                                </Text>
                                <Text as="p">
                                  {truncateMiddle(contentTypePart, NEW_LOCATION_MAX_LENGTH)}
                                </Text>
                              </Box>
                              <Box>
                                <Text as="p" fontColor="gray600" fontSize="fontSizeS">
                                  Entry name
                                </Text>
                                <Text as="p">
                                  {truncateMiddle(
                                    entryNamePart || loc.title,
                                    NEW_LOCATION_MAX_LENGTH
                                  )}
                                </Text>
                              </Box>
                              <FieldSelectionDropdown
                                isImageContent={viewModel.isImageContent}
                                selectedText={viewModel.selectedText}
                                fieldOptions={loc.fieldOptions}
                                fieldMappings={loc.fieldMappings}
                                selectedFieldIds={selectedFieldIdsByEntry[loc.id] ?? []}
                                onSelectedFieldIdsChange={handleSelectedFieldIdsChangeForEntry(
                                  loc.id
                                )}
                                onSelectableStateChange={handleSelectableStateChangeForEntry(
                                  loc.id
                                )}
                              />
                            </Flex>
                          );
                        })}
                      </Flex>
                    </>
                  )}
                </Flex>
              </Grid.Item>
            </Grid>
          </Modal.Content>
          <Modal.Controls>
            {showWizard ? (
              <>
                <Button
                  onClick={
                    wizardState?.step === WizardStep.ContentType
                      ? () => setWizard(null)
                      : handleWizardBack
                  }
                  size="small"
                  variant="secondary">
                  Back
                </Button>
                {wizardState?.step === WizardStep.SelectFields ? (
                  <Button
                    onClick={handleWizardSave}
                    size="small"
                    variant="primary"
                    isDisabled={!wizardState.selectedFieldIds.length}>
                    Save
                  </Button>
                ) : (
                  <Button
                    onClick={handleWizardNext}
                    size="small"
                    variant="primary"
                    isDisabled={isWizardNextDisabled()}>
                    Next
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button onClick={onClose} size="small" variant="secondary">
                  Cancel
                </Button>
                <Button
                  onClick={handlePrimaryAction}
                  size="small"
                  variant="primary"
                  isDisabled={isPrimaryDisabled}>
                  {primaryButtonLabel}
                </Button>
              </>
            )}
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
