import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Box, Button, Modal, Paragraph, Text } from '@contentful/f36-components';
import type { EditModalContent } from '@types';
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
  viewModel: EditModalContent;
  title: string;
  locationSectionDescription: string;
  primaryButtonLabel: string;
  additionalContent?: ReactNode;
  onConfirmPrimary?: (details: {
    selectedLocationId: string | null;
    selectedFieldIdsByLocationId: Record<string, string[]>;
  }) => void;
}

export const EditModal = ({
  isOpen,
  onClose,
  viewModel,
  title,
  locationSectionDescription,
  primaryButtonLabel,
  additionalContent,
  onConfirmPrimary,
}: EditModalProps) => {
  const hasLocationSectionDescription = locationSectionDescription.trim().length > 0;
  const hasCurrentLocations = viewModel.currentLocations.length > 0;
  const hasNewLocations = (viewModel.newLocations?.length ?? 0) > 0;
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

  const [selectedFieldIdsByLocationId, setSelectedFieldIdsByLocationId] = useState<
    Record<string, string[]>
  >(() =>
    Object.fromEntries(
      (viewModel.newLocations ?? []).map((newLocation) => [
        newLocation.id,
        [...(newLocation.selectedFieldIds ?? [])],
      ])
    )
  );

  useEffect(() => {
    setSelectedLocationId(initialSelectedLocationId);
  }, [initialSelectedLocationId]);

  const newLocationRowIdsKey = (viewModel.newLocations ?? []).map((nl) => nl.id).join('|');

  // Reset field multiselect when the modal opens or when the set of destination rows changes.
  // Do not depend on `viewModel.newLocations` reference (it can churn without semantic change).
  useEffect(() => {
    if (!isOpen) return;
    setSelectedFieldIdsByLocationId(
      Object.fromEntries(
        (viewModel.newLocations ?? []).map((newLocation) => [
          newLocation.id,
          [...(newLocation.selectedFieldIds ?? [])],
        ])
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from props only on open / row-id set change, not array identity
  }, [isOpen, newLocationRowIdsKey]);

  const handleSelectedFieldIdsChange = (
    locationId: string,
    updater: (previous: string[]) => string[]
  ) => {
    setSelectedFieldIdsByLocationId((previous) => ({
      ...previous,
      [locationId]: updater(previous[locationId] ?? []),
    }));
  };

  const handlePrimaryAction = () => {
    onConfirmPrimary?.({
      selectedLocationId,
      selectedFieldIdsByLocationId: { ...selectedFieldIdsByLocationId },
    });
  };

  const previewSectionTitle = viewModel.previewSectionTitle ?? 'Selected content';
  const previewQuotedText = (viewModel.contentPreview ?? viewModel.selectedText).trim();

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

              {hasNewLocations ? (
                <Box>
                  <Text as="p" fontWeight="fontWeightDemiBold" marginBottom="spacingM">
                    New location
                  </Text>
                  <Box className={locationList}>
                    {viewModel.newLocations?.map((newLocation) => (
                      <Box className={sectionCard} key={newLocation.id}>
                        <Text as="p" fontWeight="fontWeightDemiBold" marginBottom="spacingM">
                          {newLocation.title}
                        </Text>
                        <Text as="p" marginBottom="spacingXs">
                          Fields
                        </Text>
                        <FieldSelectionDropdown
                          selectedText={viewModel.selectedText}
                          fieldOptions={newLocation.fieldOptions}
                          fieldMappings={newLocation.fieldMappings}
                          selectedFieldIds={
                            selectedFieldIdsByLocationId[newLocation.id] ??
                            newLocation.selectedFieldIds ??
                            []
                          }
                          onSelectedFieldIdsChange={(updater) =>
                            handleSelectedFieldIdsChange(newLocation.id, updater)
                          }
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : null}

              {additionalContent}
            </Box>
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={onClose} size="small" variant="secondary">
              Cancel
            </Button>
            <Button onClick={handlePrimaryAction} size="small" variant="primary">
              {primaryButtonLabel}
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
