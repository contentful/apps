import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Box, Button, Modal, Note, Paragraph, Text } from '@contentful/f36-components';
import {
  EditModalDestinationStateKind,
  createEditModalDestinationState,
  type EditModalContent,
} from '@types';
import {
  locationButton,
  locationButtonSelected,
  locationButtonUnselected,
  locationContent,
  locationList,
  modalContent,
  sectionCard,
} from './EditModal.styles';
import { FieldSelectionDropdown } from './FieldSelectionDropdown';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'assign' | 'exclude' | null;
  viewModel: EditModalContent;
  title: string;
  locationSectionDescription: string;
  primaryButtonLabel: string;
  additionalContent?: ReactNode;
  onConfirmPrimary?: (details: {
    selectedLocationId: string | null;
    selectedFieldIds: Record<string, string[]>;
  }) => void;
}

export const EditModal = ({
  isOpen,
  onClose,
  mode,
  viewModel,
  title,
  locationSectionDescription,
  primaryButtonLabel,
  additionalContent,
  onConfirmPrimary,
}: EditModalProps) => {
  const hasLocationSectionDescription = locationSectionDescription.trim().length > 0;
  const hasCurrentLocations = viewModel.currentLocations.length > 0;
  const hasNewLocation = viewModel.newLocation.id !== '';
  const initialSelectedLocationId = useMemo(
    () =>
      viewModel.currentLocations.find((location) => location.isSelected)?.id ??
      viewModel.currentLocations[0]?.id ??
      null,
    [viewModel.currentLocations]
  );

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    initialSelectedLocationId
  );

  const [selectedFieldIds, setSelectedFieldIds] = useState(
    () => viewModel.newLocation.selectedFieldIds ?? []
  );

  const [destinationFieldState, setDestinationFieldState] = useState<{
    hasFieldOptions: boolean;
    hasSelectableOptions: boolean;
  } | null>(null);

  useEffect(() => {
    setSelectedLocationId(initialSelectedLocationId);
  }, [initialSelectedLocationId]);

  const newLocationRowIdsKey = viewModel.newLocation.id;

  // Reset field multiselect when the modal opens or when the set of destination rows changes.
  // Do not depend on `viewModel.newLocation` reference (it can churn without semantic change).
  useEffect(() => {
    if (!isOpen) return;
    setSelectedFieldIds(viewModel.newLocation.selectedFieldIds ?? []);
    setDestinationFieldState(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from props only on open / row-id set change, not array identity
  }, [isOpen, newLocationRowIdsKey]);

  const handleSelectedFieldIdsChange = (updater: (previous: string[]) => string[]) => {
    setSelectedFieldIds((previous) => updater(previous));
  };

  const handlePrimaryAction = () => {
    onConfirmPrimary?.({
      selectedLocationId,
      selectedFieldIds: {
        [viewModel.newLocation.id]: [...selectedFieldIds],
      },
    });
  };

  const previewSectionTitle = viewModel.previewSectionTitle ?? 'Selected content';
  const previewQuotedText = (viewModel.contentPreview ?? viewModel.selectedText).trim();
  const selectedDestinationCount = selectedFieldIds.length;
  const isAssignMode = mode === 'assign';
  const destinationState = useMemo(() => {
    if (!isAssignMode) {
      return createEditModalDestinationState(EditModalDestinationStateKind.Ready);
    }

    if (!hasNewLocation) {
      return createEditModalDestinationState(EditModalDestinationStateKind.MissingEntry);
    }

    if (viewModel.newLocation.fieldOptions.length === 0) {
      return createEditModalDestinationState(EditModalDestinationStateKind.NoFields);
    }

    if (destinationFieldState?.hasSelectableOptions === false) {
      return createEditModalDestinationState(EditModalDestinationStateKind.NoCompatibleFields);
    }

    if (selectedDestinationCount === 0) {
      return createEditModalDestinationState(EditModalDestinationStateKind.RequiresSelection);
    }

    return createEditModalDestinationState(EditModalDestinationStateKind.Ready);
  }, [
    isAssignMode,
    destinationFieldState?.hasSelectableOptions,
    hasNewLocation,
    selectedDestinationCount,
    viewModel.newLocation.fieldOptions.length,
  ]);
  const isPrimaryDisabled =
    isAssignMode && destinationState.kind !== EditModalDestinationStateKind.Ready;

  return (
    <Modal isShown={isOpen} onClose={onClose} size="large" shouldCloseOnOverlayClick={false}>
      {() => (
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content>
            <Box className={modalContent}>
              <Box className={sectionCard}>
                <Text as="p" fontWeight="fontWeightDemiBold" marginBottom="spacingM">
                  {previewSectionTitle}
                </Text>
                <Text as="p" fontSize="fontSizeL">
                  "{previewQuotedText}"
                </Text>
              </Box>

              <Box className={sectionCard}>
                <Text fontWeight="fontWeightDemiBold" marginBottom="spacing2Xs">
                  Current location
                </Text>
                {hasLocationSectionDescription && (
                  <Paragraph marginBottom={hasCurrentLocations ? 'spacingM' : 'none'}>
                    {locationSectionDescription}
                  </Paragraph>
                )}

                {hasCurrentLocations && (
                  <Box className={locationList}>
                    {viewModel.currentLocations.map((location) => {
                      const isSelected = location.id === selectedLocationId;

                      return (
                        <Box
                          as="button"
                          type="button"
                          key={location.id}
                          onClick={() => setSelectedLocationId(location.id)}
                          aria-pressed={isSelected}
                          className={`${locationButton} ${
                            isSelected ? locationButtonSelected : locationButtonUnselected
                          }`}>
                          <Box className={locationContent}>
                            <Text as="p" fontColor="gray600" marginBottom="spacing2Xs">
                              Content type{' '}
                              <Text as="span" fontWeight="fontWeightDemiBold" fontColor="gray900">
                                {location.contentTypeName}
                              </Text>
                            </Text>
                            <Text as="p" fontColor="gray600" marginBottom="spacing2Xs">
                              Entry name{' '}
                              <Text as="span" fontWeight="fontWeightDemiBold" fontColor="gray900">
                                {location.entryName}
                              </Text>
                            </Text>
                            <Text as="p" fontColor="gray600">
                              Field{' '}
                              <Text as="span" fontWeight="fontWeightDemiBold" fontColor="gray900">
                                {location.fieldName}
                              </Text>{' '}
                              | {location.fieldType}
                            </Text>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>

              {hasNewLocation ? (
                <Box>
                  <Text as="p" fontWeight="fontWeightDemiBold" marginBottom="spacingM">
                    New location
                  </Text>
                  <Box className={locationList}>
                    <Box className={sectionCard} key={viewModel.newLocation.id}>
                      <Text as="p" fontWeight="fontWeightDemiBold" marginBottom="spacingM">
                        {viewModel.newLocation.title}
                      </Text>
                      <Text as="p" marginBottom="spacingXs">
                        Fields
                      </Text>
                      <FieldSelectionDropdown
                        selectedText={viewModel.selectedText}
                        fieldOptions={viewModel.newLocation.fieldOptions}
                        fieldMappings={viewModel.newLocation.fieldMappings}
                        selectedFieldIds={selectedFieldIds}
                        onSelectedFieldIdsChange={handleSelectedFieldIdsChange}
                        onSelectableStateChange={setDestinationFieldState}
                      />
                    </Box>
                  </Box>
                </Box>
              ) : null}

              {isAssignMode && destinationState.kind !== EditModalDestinationStateKind.Ready ? (
                <Note
                  variant={
                    destinationState.kind === EditModalDestinationStateKind.RequiresSelection
                      ? 'warning'
                      : 'neutral'
                  }>
                  {destinationState.message}
                </Note>
              ) : null}

              {additionalContent}
            </Box>
          </Modal.Content>
          <Modal.Controls>
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
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
