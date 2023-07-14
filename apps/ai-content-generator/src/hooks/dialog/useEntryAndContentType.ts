import { useEffect, useState } from 'react';
import { ContentTypeProps, EntryProps } from 'contentful-management';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

/**
 * This hook is used to get the entry and content type of the entry.
 *
 * @param entryId Contentful entry id
 * @returns {entry, contentType}
 */
const useEntryAndContentType = (entryId: string) => {
  const [entry, setEntry] = useState<EntryProps | null>(null);
  const [contentType, setContentType] = useState<ContentTypeProps | null>(null);
  const sdk = useSDK<DialogAppSDK>();
  const cma = sdk.cma;

  const getEntryAndContentType = async () => {
    if (entryId) {
      const entry = await cma.entry.get({ entryId });
      setEntry(entry);

      const contentType = await cma.contentType.get({
        contentTypeId: entry.sys.contentType.sys.id,
      });
      setContentType(contentType);
    }
  };

  useEffect(() => {
    getEntryAndContentType();
  }, [entryId]);

  return { entry, contentType };
};

export default useEntryAndContentType;
