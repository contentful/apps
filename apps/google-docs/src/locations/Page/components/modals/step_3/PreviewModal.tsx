import React from 'react';
import { Box, Button, Flex, Modal, Paragraph, Text } from '@contentful/f36-components';
import { EntryToCreate } from '../../../../../../functions/agents/documentParserAgent/schema';
import { SelectedContentType } from '../step_2/SelectContentTypeModal';
import tokens from '@contentful/f36-tokens';

export interface PreviewResponseType {
  summary: string;
  totalEntries: number;
  entries: EntryToCreate[];
  entryPreviewData: Array<{ title: string; contentTypeName: string }>;
}
interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  preview: PreviewResponseType | null;
  onCreateEntries: (contentTypes: SelectedContentType[]) => void;
  isCreatingEntries: boolean;
  isLoading: boolean;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  preview,
  onCreateEntries,
  isCreatingEntries,
  isLoading,
}) => {
  if (!preview) {
    return null;
  }

  // for v0, we are only displaying the titles and content type names (in entryPreviewData)
  const { summary, totalEntries, entries, entryPreviewData } = preview;

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
              Based off the document, {entries.length}{' '}
              {entries.length === 1 ? 'entry is' : 'entries are'} being suggested:
            </Paragraph>

            <Box marginBottom="spacingM">
              {entries.length > 0 ? (
                <Box>
                  {entryPreviewData.map((entry, index) => {
                    return (
                      <Box
                        key={index}
                        padding="spacingS"
                        style={{
                          border: `1px solid ${tokens.gray300}`,
                          borderRadius: tokens.borderRadiusMedium,
                        }}
                        marginBottom="spacingS">
                        <Flex alignItems="center" gap="spacingXs">
                          <Text
                            fontWeight="fontWeightMedium"
                            fontSize="fontSizeM"
                            fontColor="gray900">
                            {entry.title.length > MAX_TITLE_LENGTH
                              ? entry.title.substring(0, 60) + '...'
                              : entry.title}
                          </Text>
                          <Text fontColor="gray500" fontSize="fontSizeM" as="span">
                            ({entry.contentTypeName})
                          </Text>
                        </Flex>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Paragraph color="gray600">No entries found</Paragraph>
              )}
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
                onCreateEntries(
                  entries.map((entry) => ({ id: entry.contentTypeId } as SelectedContentType))
                )
              }
              variant="primary"
              isDisabled={isLoading || entries.length === 0}>
              {isCreatingEntries
                ? 'Creating entries...'
                : entries.length === 1
                ? 'Create entry'
                : 'Create entries'}
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
