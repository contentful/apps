import React from 'react';
import { Box, Button, Flex, Modal, Paragraph, Text } from '@contentful/f36-components';
import { EntryToCreate } from '../../../../../../functions/agents/documentParserAgent/schema';
import tokens from '@contentful/f36-tokens';

export interface PreviewEntry {
  entry: EntryToCreate;
  title: string;
  contentTypeName: string;
}
interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewEntries: PreviewEntry[];
  onCreateEntries: (contentTypeIds: string[]) => void;
  isCreatingEntries: boolean;
  isLoading: boolean;
}

export const PreviewModal = ({
  isOpen,
  onClose,
  previewEntries,
  onCreateEntries,
  isCreatingEntries,
  isLoading,
}: PreviewModalProps) => {
  if (!previewEntries || previewEntries.length === 0) {
    return null;
  }

  const MAX_TITLE_LENGTH = 60;

  const handleClose = () => {
    if (!isLoading && !isCreatingEntries) {
      onClose();
    }
  };

  return (
    <Modal
      isShown={isOpen}
      onClose={handleClose}
      size="large"
      shouldCloseOnOverlayClick={!isLoading && !isCreatingEntries}
      shouldCloseOnEscapePress={!isLoading && !isCreatingEntries}>
      {() => (
        <>
          <Modal.Header title="Preview entries" onClose={handleClose} />
          <Modal.Content>
            <Paragraph marginBottom="spacingM" color="gray700">
              Based off the document, {previewEntries.length}{' '}
              {previewEntries.length === 1 ? 'entry is' : 'entries are'} being suggested:
            </Paragraph>

            <Box marginBottom="spacingM">
              {previewEntries.map((item, index) => (
                <Box
                  key={index}
                  padding="spacingS"
                  style={{
                    border: `1px solid ${tokens.gray300}`,
                    borderRadius: tokens.borderRadiusMedium,
                  }}
                  marginBottom="spacingS">
                  <Flex alignItems="center" gap="spacingXs">
                    <Text fontWeight="fontWeightMedium" fontSize="fontSizeM" fontColor="gray900">
                      {item.title.length > MAX_TITLE_LENGTH
                        ? item.title.substring(0, MAX_TITLE_LENGTH) + '...'
                        : item.title}
                    </Text>
                    <Text fontColor="gray500" fontSize="fontSizeM" as="span">
                      ({item.contentTypeName})
                    </Text>
                  </Flex>
                </Box>
              ))}
            </Box>
          </Modal.Content>
          <Modal.Controls>
            <Button
              onClick={handleClose}
              variant="secondary"
              isDisabled={isLoading || isCreatingEntries}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                onCreateEntries(previewEntries.map((preview) => preview.entry.contentTypeId))
              }
              variant="primary"
              isDisabled={isLoading || previewEntries.length === 0}>
              {isCreatingEntries
                ? 'Creating entries...'
                : previewEntries.length === 1
                ? 'Create entry'
                : 'Create entries'}
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
