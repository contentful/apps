import React, { useMemo } from 'react';
import { Button, Modal, Paragraph, Flex, EntryCard } from '@contentful/f36-components';
import { EntryProps } from 'contentful-management';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { getEntryDisplayName } from '../../../../../utils/getEntryTitle';

interface ReviewEntriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  createdEntries: EntryProps[];
  contentTypeNamesMap: Record<string, string>;
  spaceId: string;
  defaultLocale: string;
}

export const ReviewEntriesModal: React.FC<ReviewEntriesModalProps> = ({
  isOpen,
  onClose,
  createdEntries,
  contentTypeNamesMap,
  spaceId,
  defaultLocale,
}) => {
  const sdk = useSDK<PageAppSDK>();

  const entryLinks = useMemo(() => {
    return createdEntries.map((entry) => {
      const contentTypeId = entry.sys.contentType.sys.id;
      const contentTypeName = contentTypeNamesMap[contentTypeId] || contentTypeId;

      return {
        entry,
        displayName: getEntryDisplayName(entry, defaultLocale),
        contentType: contentTypeName,
        url: `https://${sdk.hostnames.webapp}/spaces/${spaceId}/environments/${sdk.ids.environment}/entries/${entry.sys.id}`,
      };
    });
  }, [
    createdEntries,
    contentTypeNamesMap,
    spaceId,
    defaultLocale,
    sdk.hostnames.webapp,
    sdk.ids.environment,
  ]);

  const entryCount = createdEntries.length;
  const entryHasText = entryCount === 1 ? 'entry has' : 'entries have';

  return (
    <Modal isShown={isOpen} onClose={onClose} size="large">
      {() => (
        <>
          <Modal.Header title="Review entries" onClose={onClose} />
          <Modal.Content>
            <Flex flexDirection="column" gap="spacingM">
              <Paragraph marginBottom="none">
                Success! {entryCount} {entryHasText} been created:
              </Paragraph>
              <Flex flexDirection="column" gap="spacingS">
                {entryLinks.map(({ entry, displayName, url, contentType }) => (
                  <EntryCard
                    key={entry.sys.id}
                    title={displayName}
                    contentType={contentType}
                    size="small"
                    status="draft"
                    onClick={() => window.open(url, '_blank')}
                  />
                ))}
              </Flex>
            </Flex>
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={onClose} variant="secondary">
              Done
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
