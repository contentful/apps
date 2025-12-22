import React from 'react';
import { Box, Button, Flex, Modal, Paragraph } from '@contentful/f36-components';
import { EntryToCreate } from '../../../../../../functions/agents/documentParserAgent/schema';
import { SelectedContentType } from '../step_2/SelectContentTypeModal';

export interface PreviewData {
  summary: string;
  totalEntries: number;
  entries: EntryToCreate[];
}
interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  preview: PreviewData | null;
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

  const { summary, totalEntries, entries } = preview;

  const handleClose = () => {
    if (!isLoading && !isCreatingEntries) {
      onClose();
    }
  };

  return (
    <Modal
      title="Create entries"
      isShown={isOpen}
      onClose={handleClose}
      size="large"
      shouldCloseOnOverlayClick={!isLoading && !isCreatingEntries}
      shouldCloseOnEscapePress={!isLoading && !isCreatingEntries}>
      {() => (
        <>
          <Modal.Header title="Create entries" onClose={handleClose} />
          <Modal.Content>
            <Paragraph marginBottom="spacingM" color="gray700">
              {preview.summary ||
                `Based off the document, ${totalEntries} ${
                  totalEntries === 1 ? 'entry is' : 'entries are'
                } being suggested:`}
            </Paragraph>

            <Box marginBottom="spacingM">
              {entries.length > 0 ? (
                <Box>
                  {entries.map((entry, index) => {
                    const title = entry.fields.title?.['en-US'] || '';
                    return (
                      <Box
                        key={index}
                        style={{
                          padding: '10px 14px',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          marginBottom: '8px',
                        }}>
                        <Flex alignItems="center">
                          <Box style={{ flex: 1, minWidth: 0 }}>
                            <span
                              style={{
                                fontWeight: 500,
                                fontSize: '14px',
                                color: '#111827',
                              }}>
                              {title.length > 60 ? title.substring(0, 60) + '...' : title}
                            </span>
                            <span
                              style={{
                                color: '#6b7280',
                                fontSize: '14px',
                                marginLeft: '8px',
                                fontWeight: 400,
                              }}>
                              ({entry.contentTypeId || 'unknown'})
                            </span>
                          </Box>
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
              {isCreatingEntries ? 'Creating entries...' : 'Create entries'}
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
