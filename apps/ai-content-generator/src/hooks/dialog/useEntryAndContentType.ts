import { useEffect, useState } from 'react';
import { ContentTypeProps, EntryProps } from 'contentful-management';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import richTextModel from '@utils/dialog/common-generator/richTextModel';

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
    try {
      if (!entryId) {
        throw new Error('Entry id is null');
      }

      const entry = await cma.entry.get({ entryId });
      setEntry(entry);

      const contentType = await cma.contentType.get({
        contentTypeId: entry.sys.contentType.sys.id,
      });

      setContentType(contentType);

      return { entry, contentType };
    } catch (error) {
      // console.error(error);

      setEntry(null);
      setContentType(null);
      return { entry: null, contentType: null };
    }
  };

  const updateEntry = async (fieldKey: string, fieldLocale: string, updatedText: string) => {
    try {
      const { entry, contentType } = await getEntryAndContentType();
      if (entry === null || contentType === null) {
        throw new Error('Entry or content type is null');
      }
      const fieldType = contentType?.fields.find((field) => field.id === fieldKey)?.type;
      const isRichText = fieldType === 'RichText';

      const formattedText = isRichText
        ? richTextModel(updatedText)
        : updatedText
            .replace(/^\s+|\s+$/g, '')
            .replace(/^['"]+|['"]+$/g, '')
            .trim();

      if (!entry.fields[fieldKey]) {
        entry.fields[fieldKey] = {
          [fieldLocale]: formattedText,
        };
      } else {
        entry.fields[fieldKey][fieldLocale] = formattedText;
      }

      await cma.entry.update(
        {
          entryId,
        },
        entry
      );

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  useEffect(() => {
    getEntryAndContentType();
  }, [entryId]);

  return { entry, contentType, updateEntry };
};

export default useEntryAndContentType;
