import { useEffect, useState } from 'react';
import { Button, EntryCard, Flex, Modal, Note, Spinner } from '@contentful/f36-components';
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

// Entries can be deleted from the space after a run completes — tell the user instead of showing nothing
function buildMissingEntriesMessage(missingCount: number, totalCount: number): string {
  const subject =
    missingCount === totalCount
      ? missingCount === 1
        ? 'The entry'
        : `All ${missingCount} entries`
      : `${missingCount} of the ${totalCount} entries`;
  const [verb, pronoun] = missingCount === 1 ? ['is', 'It was'] : ['are', 'They were'];

  return `${subject} created by this run ${verb} no longer available. ${pronoun} likely deleted from this space or environment.`;
}

function entryStatus(entry: EntryProps): 'draft' | 'published' | 'changed' {
  if (!entry.sys.publishedAt) return 'draft';
  if (entry.sys.version > (entry.sys.publishedVersion ?? 0) + 1) return 'changed';
  return 'published';
}

export function EntriesCreatedModal({ isOpen, onClose, sdk, entryIds }: EntriesCreatedModalProps) {
  const [entries, setEntries] = useState<EntryProps[]>([]);
  const [ctMap, setCtMap] = useState<ContentTypeDisplayInfoMap>(new Map());
  // Starts true so the first paint shows the spinner, not a premature "entries missing" note
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    if (entryIds.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const spaceId = sdk.ids.space;
    const environmentId = sdk.ids.environmentAlias ?? sdk.ids.environment;

    Promise.all(
      entryIds.map((id) =>
        sdk.cma.entry.get({ entryId: id, spaceId, environmentId }).catch(() => null)
      )
    )
      .then(async (results) => {
        const fetched = results.filter((e): e is EntryProps => e !== null);
        setEntries(fetched);
        // Content type names are cosmetic — a failure here must not blank out the entries
        const ctIds = fetched.map((e) => e.sys.contentType.sys.id);
        setCtMap(await fetchContentTypesInfoByIds(sdk, ctIds).catch(() => new Map()));
      })
      .catch(() => {
        setEntries([]);
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, entryIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const defaultLocale = sdk.locales.default;
  const missingCount = entryIds.length - entries.length;

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
                {missingCount > 0 && (
                  <Note variant="warning">
                    {buildMissingEntriesMessage(missingCount, entryIds.length)}
                  </Note>
                )}
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
