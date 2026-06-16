import { useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { Box, Button, Grid, Modal, Flex, Text, TextInput } from '@contentful/f36-components';
import { PlusIcon } from '@contentful/f36-icons';
import { type EditModalContent, type AddEntryWizardParams, type EditModalNewLocation } from '@types';
import type { WorkflowContentType } from '@types';

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
  type WizardState,
  type ExistingEntryOption,
} from './AddEntryWizard';
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
  buildNewLocationForContentType?: (contentTypeId: string) => EditModalNewLocation;
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
  buildNewLocationForContentType,
}: EditModalProps) => {
  const [wizardState, setWizardState] = useState<WizardState | null>(null);
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
    setWizardState(null);
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

  const handleWizardNext = () => {
    if (!wizardState) return;
    switch (wizardState.step) {
      case WizardStep.ContentType:
        setWizardState({ ...wizardState, step: WizardStep.IsReference });
        break;
      case WizardStep.IsReference:
        setWizardState({ ...wizardState, step: wizardState.isReference ? WizardStep.SelectReference : WizardStep.SelectFields });
        break;
      case WizardStep.SelectReference:
        setWizardState({ ...wizardState, step: WizardStep.SelectFields });
        break;
    }
  };

  const handleWizardBack = () => {
    if (!wizardState) return;
    switch (wizardState.step) {
      case WizardStep.IsReference:
        setWizardState({ ...wizardState, step: WizardStep.ContentType });
        break;
      case WizardStep.SelectReference:
        setWizardState({ ...wizardState, step: WizardStep.IsReference });
        break;
      case WizardStep.SelectFields:
        setWizardState({ ...wizardState, step: wizardState.isReference ? WizardStep.SelectReference : WizardStep.IsReference });
        break;
    }
  };

  const handleWizardSave = () => {
    if (!wizardState) return;
    onAddEntry?.({
      contentTypeId: wizardState.contentTypeId,
      isReference: wizardState.isReference ?? false,
      referenceEntryId: wizardState.isReference ? wizardState.referenceEntryId || null : null,
      fieldIds: wizardState.selectedFieldIds,
    });
    setWizardState(null);
  };

  const isWizardNextDisabled = () => {
    if (!wizardState) return true;
    switch (wizardState.step) {
      case WizardStep.ContentType: return !wizardState.contentTypeId;
      case WizardStep.IsReference: return wizardState.isReference === null;
      case WizardStep.SelectReference: return !wizardState.referenceEntryId;
      default: return false;
    }
  };

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
                  ) : null}
                </Flex>
              </Grid.Item>

              {/* New location */}
              <Grid.Item>
                <Flex flexDirection="column" gap="spacingS" padding="spacingS">
                  {showWizard && wizardState && buildNewLocationForContentType ? (
                    <AddEntryWizard
                      state={wizardState}
                      onChange={(next) => setWizardState((prev) => prev ? { ...prev, ...next } : prev)}
                      contentTypes={contentTypes}
                      existingEntries={existingEntries}
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
                            onClick={() => setWizardState({ ...INITIAL_WIZARD_STATE })}>
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

                      <Flex flexDirection="column" gap="spacingS" className={newLocationScrollableList}>
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
                                  {truncateMiddle(entryNamePart || loc.title, NEW_LOCATION_MAX_LENGTH)}
                                </Text>
                              </Box>
                              <FieldSelectionDropdown
                                isImageContent={viewModel.isImageContent}
                                selectedText={viewModel.selectedText}
                                fieldOptions={loc.fieldOptions}
                                fieldMappings={loc.fieldMappings}
                                selectedFieldIds={selectedFieldIdsByEntry[loc.id] ?? []}
                                onSelectedFieldIdsChange={handleSelectedFieldIdsChangeForEntry(loc.id)}
                                onSelectableStateChange={handleSelectableStateChangeForEntry(loc.id)}
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
                <Button onClick={wizardState?.step === WizardStep.ContentType ? () => setWizardState(null) : handleWizardBack} size="small" variant="secondary">
                  Back
                </Button>
                {wizardState?.step === WizardStep.SelectFields ? (
                  <Button onClick={handleWizardSave} size="small" variant="primary" isDisabled={!wizardState.selectedFieldIds.length}>
                    Save
                  </Button>
                ) : (
                  <Button onClick={handleWizardNext} size="small" variant="primary" isDisabled={isWizardNextDisabled()}>
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
