import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Box, Button, Modal, Flex, Text } from '@contentful/f36-components';
import { type EditModalContent } from '@types';

import { modalContent, modalContentWithDropdown, sectionCard } from './EditModal.styles';
import { FieldSelectionDropdown } from './FieldSelectionDropdown';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewModel: EditModalContent;
  title: string;
  primaryButtonLabel: string;
  additionalContent?: ReactNode;
  onConfirmPrimary?: (selectedFieldIds: string[]) => void;
}

export const EditModal = ({
  isOpen,
  onClose,
  viewModel,
  title,
  primaryButtonLabel,
  additionalContent,
  onConfirmPrimary,
}: EditModalProps) => {
  const hasNewLocation = viewModel.newLocation.id !== '';

  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>(
    () => viewModel.newLocation.initialFieldIds
  );

  const [destinationFieldState, setDestinationFieldState] = useState<{
    hasFieldOptions: boolean;
    hasSelectableOptions: boolean;
  } | null>(null);

  const newLocationRowIdsKey = viewModel.newLocation.id;

  // Reset field selections when the modal opens or when the destination entry changes.
  // Do not depend on `viewModel.newLocation` reference (it can churn without semantic change).
  useEffect(() => {
    if (!isOpen) return;
    setSelectedFieldIds(viewModel.newLocation.initialFieldIds);
    setDestinationFieldState(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from props only on open / row-id set change, not array identity
  }, [isOpen, newLocationRowIdsKey]);

  const handleSelectedFieldIdsChange = (updater: (previous: string[]) => string[]) => {
    setSelectedFieldIds((previous) => updater(previous));
  };

  const handlePrimaryAction = () => {
    onConfirmPrimary?.([...selectedFieldIds]);
  };

  const previewSectionTitle = viewModel.previewSectionTitle ?? 'Selected content';
  const previewQuotedText = (viewModel.contentPreview ?? viewModel.selectedText).trim();

  const isPrimaryDisabled = useMemo(() => {
    if (!hasNewLocation || viewModel.newLocation.fieldOptions.length === 0) return true;
    if (destinationFieldState?.hasSelectableOptions === false) return true;
    const initial = viewModel.newLocation.initialFieldIds;
    const unchanged =
      selectedFieldIds.length === initial.length &&
      selectedFieldIds.every((id) => initial.includes(id));
    return unchanged;
  }, [
    hasNewLocation,
    viewModel.newLocation.fieldOptions.length,
    viewModel.newLocation.initialFieldIds,
    destinationFieldState?.hasSelectableOptions,
    selectedFieldIds,
  ]);

  return (
    <Modal isShown={isOpen} onClose={onClose} size="large" shouldCloseOnOverlayClick={false}>
      {() => (
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content>
            <Box className={`${modalContent} ${modalContentWithDropdown}`}>
              <Box className={sectionCard}>
                <Flex flexDirection="column" gap="spacingXs">
                  <Text as="p" fontWeight="fontWeightDemiBold">
                    {previewSectionTitle}
                  </Text>
                  {additionalContent ??
                    (viewModel.isImageContent ? (
                      <Text as="p">
                        <Text as="span">IMAGE: </Text>
                        {previewQuotedText}
                      </Text>
                    ) : (
                      <Text as="p">"{previewQuotedText}"</Text>
                    ))}
                </Flex>
              </Box>

              {hasNewLocation && (
                <Box className={sectionCard}>
                  <Text as="p" fontWeight="fontWeightDemiBold" marginBottom="spacingM">
                    Assign to fields
                  </Text>
                  <Text as="p" marginBottom="spacingXs">
                    {viewModel.newLocation.title}
                  </Text>
                  <FieldSelectionDropdown
                    isImageContent={viewModel.isImageContent}
                    selectedText={viewModel.selectedText}
                    fieldOptions={viewModel.newLocation.fieldOptions}
                    fieldMappings={viewModel.newLocation.fieldMappings}
                    selectedFieldIds={selectedFieldIds}
                    onSelectedFieldIdsChange={handleSelectedFieldIdsChange}
                    onSelectableStateChange={setDestinationFieldState}
                  />
                </Box>
              )}
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
