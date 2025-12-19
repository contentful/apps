import { Button, Modal, Paragraph, Box, Flex } from '@contentful/f36-components';
import { EntryToCreate } from '../../../functions/agents/documentParserAgent/schema';

interface PreviewData {
  summary: string;
  totalEntries: number;
  entries: EntryToCreate[];
}

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEntries: () => void;
  preview: PreviewData | null;
  isLoading: boolean;
}

export const PreviewModal = ({
  isOpen,
  onClose,
  onCreateEntries,
  preview,
  isLoading,
}: PreviewModalProps) => {
  const handleCreateEntries = () => {
    onCreateEntries();
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!preview) {
    return null;
  }

  const entries = preview.entries || [];
  const totalEntries = preview.totalEntries ?? entries.length;

  return (
    <Modal
      title="Create entries"
      isShown={isOpen}
      onClose={handleClose}
      size="large"
      shouldCloseOnOverlayClick={!isLoading}
      shouldCloseOnEscapePress={!isLoading}>
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
            <Button onClick={handleClose} variant="secondary" isDisabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateEntries}
              variant="primary"
              isDisabled={isLoading || entries.length === 0}>
              Create entries
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
