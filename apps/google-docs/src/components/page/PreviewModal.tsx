import { Button, Modal, Paragraph, Box, Flex, Text, Card } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { EntryToCreate } from '../../../functions/agents/documentParserAgent/schema';
import { SelectedContentType } from './ContentTypePickerModal';
import { PageAppSDK } from '@contentful/app-sdk';

interface PreviewData {
  summary: string;
  totalEntries: number;
  entries: EntryToCreate[];
}

interface PreviewModalProps {
  sdk: PageAppSDK;
  isOpen: boolean;
  onClose: () => void;
  onCreateEntries: (contentTypes: SelectedContentType[]) => void;
  preview: PreviewData | null;
  isCreatingEntries: boolean;
  isLoading: boolean;
}

export const PreviewModal = ({
  sdk,
  isOpen,
  isCreatingEntries,
  onClose,
  onCreateEntries,
  preview,
  isLoading,
}: PreviewModalProps) => {
  const handleClose = () => {
    if (!isLoading && !isCreatingEntries) {
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
                    const title = entry.fields.displayField?.[sdk.locales.default] || '';
                    return (
                      <Card
                        key={index}
                        padding="default"
                        marginBottom="spacingS"
                        style={{ padding: `${tokens.spacingS} ${tokens.spacingM}` }}>
                        <Flex alignItems="center">
                          <Box style={{ flex: 1, minWidth: 0 }}>
                            <Text
                              as="span"
                              fontWeight="fontWeightMedium"
                              fontSize="fontSizeM"
                              style={{ color: tokens.gray900 }}>
                              {title.length > 60 ? title.substring(0, 60) + '...' : title}
                            </Text>
                            <Text
                              as="span"
                              fontWeight="fontWeightNormal"
                              fontSize="fontSizeM"
                              style={{ color: tokens.gray500, marginLeft: tokens.spacingXs }}>
                              ({entry.contentTypeId || 'unknown'})
                            </Text>
                          </Box>
                        </Flex>
                      </Card>
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
              Create entries
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
