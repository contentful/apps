import { useEffect, useState } from 'react';
import { Button, EntryCard, Flex, Modal, Spinner } from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import type { EntryProps } from 'contentful-management';
import { fetchContentTypesInfoByIds } from '../../../../services/contentTypeService';
import type { ContentTypeDisplayInfoMap } from '../../../../utils/overviewEntryList';
import { getEntryDisplayTitle } from '../../../../utils/getEntryDisplayTitle';

interface EntriesCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  sdk: PageAppSDK;
  entryIds: string[];
}

function resolveContentTypeLabel(contentTypeId: string, map?: ContentTypeDisplayInfoMap): string {
  const name = map?.get(contentTypeId)?.name?.trim();
  return name && name.length > 0 ? name : 'Content type';
}

function entryStatus(entry: EntryProps): 'draft' | 'published' | 'changed' {
  if (!entry.sys.publishedAt) return 'draft';
  if (entry.sys.version > (entry.sys.publishedVersion ?? 0) + 1) return 'changed';
  return 'published';
}

export function EntriesCreatedModal({ isOpen, onClose, sdk, entryIds }: EntriesCreatedModalProps) {
  const [entries, setEntries] = useState<EntryProps[]>([]);
  const [ctMap, setCtMap] = useState<ContentTypeDisplayInfoMap>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || entryIds.length === 0) return;

    setIsLoading(true);

    const spaceId = sdk.ids.space;
    const environmentId = sdk.ids.environmentAlias ?? sdk.ids.environment;

    Promise.all(
      entryIds.map((id) =>
        sdk.cma.entry.get({ entryId: id, spaceId, environmentId }).catch(() => null)
      )
    )
      .then((results) => {
        const fetched = results.filter((e): e is EntryProps => e !== null);
        setEntries(fetched);
        const ctIds = fetched.map((e) => e.sys.contentType.sys.id);
        return fetchContentTypesInfoByIds(sdk, ctIds).then(setCtMap);
      })
      .catch(() => {
        setEntries([]);
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, entryIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const defaultLocale = sdk.locales.default;

  return (
    <Modal isShown={isOpen} onClose={onClose} size="large" shouldCloseOnEscapePress>
      {() => (
        <>
          <Modal.Header title="Entries created" onClose={onClose} />
          <Modal.Content>
            {isLoading ? (
              <Flex justifyContent="center" padding="spacingL">
                <Spinner size="large" />
              </Flex>
            ) : (
              <Flex flexDirection="column" gap="spacingS">
                {entries.map((entry) => {
                  const contentTypeId = entry.sys.contentType.sys.id;
                  const title = getEntryDisplayTitle(
                    entry,
                    defaultLocale,
                    ctMap.get(contentTypeId)
                  );
                  const contentTypeLabel = resolveContentTypeLabel(contentTypeId, ctMap);
                  return (
                    <EntryCard
                      key={entry.sys.id}
                      contentType={contentTypeLabel}
                      title={title}
                      status={entryStatus(entry)}
                      ariaLabel={`Open entry ${title} in Contentful`}
                      onClick={() => {
                        void sdk.navigator.openEntry(entry.sys.id, { slideIn: true });
                      }}
                    />
                  );
                })}
              </Flex>
            )}
          </Modal.Content>
          <Modal.Controls>
            <Button variant="secondary" onClick={onClose}>
              Done
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}
