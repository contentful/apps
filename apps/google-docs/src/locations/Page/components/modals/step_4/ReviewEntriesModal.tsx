import React, { useMemo } from 'react';
import { Button, Modal, Paragraph, TextLink, Flex, Box } from '@contentful/f36-components';
import { EntryProps } from 'contentful-management';
import { ArrowSquareOutIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

interface ReviewEntriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  createdEntries: EntryProps[];
  spaceId: string;
  defaultLocale: string;
}

function getEntryDisplayName(entry: EntryProps, defaultLocale: string): string {
  // Try to find a 'title' field first
  if (entry.fields.title) {
    const titleValue = entry.fields.title[defaultLocale] || Object.values(entry.fields.title)[0];
    if (titleValue && typeof titleValue === 'string') {
      return titleValue;
    }
  }

  // Fall back to the first text/Symbol field
  for (const [_fieldId, localizedValue] of Object.entries(entry.fields)) {
    if (localizedValue && typeof localizedValue === 'object') {
      const value = localizedValue[defaultLocale] || Object.values(localizedValue)[0];
      if (value && typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }
  }

  // Last resort: use entry ID
  return entry.sys.id;
}

export const ReviewEntriesModal: React.FC<ReviewEntriesModalProps> = ({
  isOpen,
  onClose,
  createdEntries,
  spaceId,
  defaultLocale,
}) => {
  const sdk = useSDK<PageAppSDK>();

  const entryLinks = useMemo(() => {
    return createdEntries.map((entry) => {
      const displayName = getEntryDisplayName(entry, defaultLocale);
      const url = `https://${sdk.hostnames.webapp}/spaces/${spaceId}/environments/${sdk.ids.environment}/entries/${entry.sys.id}`;

      return {
        entry,
        displayName,
        url,
      };
    });
  }, [createdEntries, spaceId, defaultLocale]);

  const entryCount = createdEntries.length;
  const entryHasText = entryCount === 1 ? 'entry has' : 'entries have';

  return (
    <Modal isShown={isOpen} onClose={onClose} size="medium">
      {() => (
        <>
          <Modal.Header title="Review entries" onClose={onClose} />
          <Modal.Content>
            <Flex flexDirection="column" gap="spacingM">
              <Paragraph marginBottom="none">
                Success! {entryCount} {entryHasText} been created:
              </Paragraph>
              <Flex
                as="ul"
                flexDirection="column"
                gap="spacingS"
                style={{ padding: 0, paddingLeft: tokens.spacingM, margin: 0 }}>
                {entryLinks.map(({ entry, displayName, url }) => (
                  <Box as="li" key={entry.sys.id}>
                    <TextLink
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      icon={<ArrowSquareOutIcon variant="muted" size="small" />}
                      alignIcon="end">
                      {displayName}
                    </TextLink>
                  </Box>
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
