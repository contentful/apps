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
}

export const EditModal = ({
  isOpen,
  onClose,
  viewModel,
  title,
  locationSectionDescription,
  primaryButtonLabel,
  additionalContent,
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

  useEffect(() => {
    setSelectedFieldIdsByLocationId(
      Object.fromEntries(
        (viewModel.newLocations ?? []).map((newLocation) => [
          newLocation.id,
          [...(newLocation.selectedFieldIds ?? [])],
        ])
      )
    );
  }, [viewModel.newLocations]);

  const handleSelectedFieldIdsChange = (locationId: string, selectedFieldIds: string[]) => {
    setSelectedFieldIdsByLocationId((previous) => ({
      ...previous,
      [locationId]: selectedFieldIds,
    }));
  };

  const handlePrimaryAction = () => {
    // TODO: Wire the primary edit-modal action to use the selected fields per new location.
  };

  return (
    <Modal isShown={isOpen} onClose={onClose} size="large" shouldCloseOnOverlayClick={false}>
      {() => (
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content>
            <Box className={modalContent}>
              <Box className={sectionCard}>
                <Text as="p" fontWeight="fontWeightDemiBold" marginBottom="spacingM">
                  Selected content
                </Text>
                <Text as="p" fontSize="fontSizeL">
                  "{viewModel.selectedText}"
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
                      <Box className={sectionCard} key={newLocation.title}>
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
                          onSelectedFieldIdsChange={(selectedFieldIds) =>
                            handleSelectedFieldIdsChange(newLocation.id, selectedFieldIds)
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
