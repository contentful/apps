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
  const initialSelectedLocationId = useMemo(
    () =>
      viewModel.locations.find((location) => location.isSelected)?.id ??
      viewModel.locations[0]?.id ??
      null,
    [viewModel.locations]
  );
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    initialSelectedLocationId
  );

  useEffect(() => {
    setSelectedLocationId(initialSelectedLocationId);
  }, [initialSelectedLocationId]);

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
                <Text as="p" fontWeight="fontWeightDemiBold" marginBottom="spacing2Xs">
                  Current location
                </Text>
                <Paragraph marginBottom="spacingM">{locationSectionDescription}</Paragraph>

                <Box className={locationList}>
                  {viewModel.locations.map((location) => {
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
                              {location.contentTypeId}
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
              </Box>

              {additionalContent}
            </Box>
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={onClose} size="small" variant="secondary">
              Cancel
            </Button>
            <Button onClick={() => undefined} size="small" variant="primary">
              {primaryButtonLabel}
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
