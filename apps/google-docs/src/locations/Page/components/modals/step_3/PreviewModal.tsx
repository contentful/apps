import React, { useEffect, useState } from 'react';
import { Box, Button, Flex, Modal, Paragraph, Text } from '@contentful/f36-components';
import { EntryToCreate } from '../../../../../../functions/agents/documentParserAgent/schema';
import { SelectedContentType } from '../step_2/SelectContentTypeModal';
import { PageAppSDK } from '@contentful/app-sdk';
import { fetchEntryTitle } from '../../../../../services/fetchEntryTitle';

export interface PreviewData {
  summary: string;
  totalEntries: number;
  entries: EntryToCreate[];
}
interface PreviewModalProps {
  sdk: PageAppSDK;
  isOpen: boolean;
  onClose: () => void;
  preview: PreviewData | null;
  onCreateEntries: (contentTypes: SelectedContentType[]) => void;
  isCreatingEntries: boolean;
  isLoading: boolean;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  sdk,
  isOpen,
  onClose,
  preview,
  onCreateEntries,
  isCreatingEntries,
  isLoading,
}) => {
  const [entryTitles, setEntryTitles] = useState<
    Record<number, { title: string; contentTypeName: string }>
  >({});

  useEffect(() => {
    if (!preview) return;

    // Fetch titles for all entries
    preview.entries.forEach(async (entry, index) => {
      const { title, contentTypeName } = await fetchEntryTitle(sdk, entry, sdk.locales.default);
      setEntryTitles((prev) => ({ ...prev, [index]: { title, contentTypeName } }));
    });
  }, [preview, sdk]);

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
                  {Object.values(entryTitles).map((entryTitle, index) => {
                    return (
                      <Box
                        key={index}
                        padding="spacingM"
                        style={{
                          backgroundColor: 'var(--gray-100)',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--border-radius-medium)',
                        }}
                        marginBottom="spacingS">
                        <Flex alignItems="center">
                          <Box style={{ flex: 1, minWidth: 0 }}>
                            <Text
                              fontWeight="fontWeightDemiBold"
                              fontSize="fontSizeM"
                              fontColor="gray900">
                              {entryTitle.title.length > 60
                                ? entryTitle.title.substring(0, 60) + '...'
                                : entryTitle.title}
                            </Text>
                            <Text
                              fontColor="gray600"
                              fontSize="fontSizeM"
                              marginLeft="spacingXs"
                              as="span">
                              ({entryTitles[index].contentTypeName})
                            </Text>
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
