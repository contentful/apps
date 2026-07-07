import { Button, EntryCard, Flex, Modal, Paragraph } from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import type { EntryProps } from 'contentful-management';
import { getEntryDisplayTitle } from '../../../../utils/getEntryDisplayTitle';
import type { ContentTypeDisplayInfoMap } from '../../../../utils/overviewEntryList';

export interface SummaryModalProps {
  isOpen: boolean;
  sdk: PageAppSDK;
  entries: EntryProps[];
  contentTypeDisplayInfoMap?: ContentTypeDisplayInfoMap;
  defaultLocale: string;
  onDone: () => void;
}

function resolveContentTypeLabel(contentTypeId: string, map?: ContentTypeDisplayInfoMap): string {
  const name = map?.get(contentTypeId)?.name?.trim();
  return name && name.length > 0 ? name : 'Content type';
}

export function SummaryModal({
  isOpen,
  sdk,
  entries,
  contentTypeDisplayInfoMap,
  defaultLocale,
  onDone,
}: SummaryModalProps) {
  const count = entries.length;
  const successLine =
    count === 1
      ? 'Success! 1 entry has been created:'
      : `Success! ${count} entries have been created:`;

  return (
    <Modal
      isShown={isOpen}
      onClose={onDone}
      size="large"
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEscapePress>
      {() => (
        <>
          <Modal.Header title="Entries created" onClose={onDone} />
          <Modal.Content>
            <Paragraph marginBottom="spacingM">{successLine}</Paragraph>
            <Flex flexDirection="column" gap="spacingS">
              {entries.map((entry) => {
                const contentTypeId = entry.sys.contentType.sys.id;
                const info = contentTypeDisplayInfoMap?.get(contentTypeId);
                const title = getEntryDisplayTitle(entry, defaultLocale, info);
                const contentTypeLabel = resolveContentTypeLabel(
                  contentTypeId,
                  contentTypeDisplayInfoMap
                );
                return (
                  <EntryCard
                    key={entry.sys.id}
                    contentType={contentTypeLabel}
                    title={title}
                    status="draft"
                    ariaLabel={`Open entry ${title} (${entry.sys.id}) in Contentful`}
                    onClick={() => {
                      void sdk.navigator.openEntry(entry.sys.id, { slideIn: true });
                    }}
                  />
                );
              })}
            </Flex>
          </Modal.Content>
          <Modal.Controls>
            <Button variant="secondary" onClick={onDone}>
              Done
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}
