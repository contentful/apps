import {
  EntryListEntriesType,
  EntryListExtensionSDK,
  EntryListExtraDataType,
} from '@contentful/app-sdk';
import { CollectionProp, ContentTypeProps, PlainClientAPI } from 'contentful-management';

const DEFAULT_ENTRY_FIELD_LOCALE = 'en-US';
const FIELD_TYPES_WITH_REFS = ['Link', 'RichText'];
const NODE_TYPES_WITH_REFS = [
  'embedded-entry-block',
  'embedded-entry-inline',
  'embedded-asset-block',
];

type OnEntryListUpdatedHandler = (props: {
  entries: EntryListEntriesType;
  sdk: EntryListExtensionSDK;
  cma: PlainClientAPI;
}) => Promise<EntryListExtraDataType>;
export const onEntryListUpdated: OnEntryListUpdatedHandler = async ({
  entries,
  sdk,
  cma,
}) => {
  const contentTypes = await getContentTypes(cma)

  const values = entries.reduce<EntryListExtraDataType['values']>(
    (res, entry) => {
      let numberOfRefs = 0;

      const entryTypeId = entry.sys.contentType.sys.id;
      const entryContentType = contentTypes.items.find(
        (item) => item.sys.id === entryTypeId,
      );

      Object.keys(entry.fields).forEach((fieldId) => {
        const field = entry.fields[fieldId];
        const fieldInfo = entryContentType?.fields.find(
          (item) => item.id === fieldId,
        );

        if (!fieldInfo) {
          return;
        }

        const isFieldWithRefs = FIELD_TYPES_WITH_REFS.includes(
          fieldInfo.items?.type || fieldInfo.type,
        );

        if (!isFieldWithRefs) {
          return;
        }

        const fieldData = field[DEFAULT_ENTRY_FIELD_LOCALE];
        const fieldType = fieldInfo.type;

        switch (fieldType) {
          case 'Link':
            numberOfRefs++;
            return;
          case 'Array':
            numberOfRefs += fieldData.length;
            return;
          case 'RichText':
            numberOfRefs += getNumberOfRefsInRichText(fieldData.content);
            return;
          default:
            return;
        }
      });

      res[entry.sys.id] = `${numberOfRefs}`;
      return res;
    },
    {},
  );

  return {
    values,
  };
};

type ContentNode = {
  nodeType: string;
  content: ContentNode[];
  data: Record<string, unknown>;
};

export const getNumberOfRefsInRichText = (content: ContentNode[]) => {
  let count = 0;

  content.forEach((node) => {
    if (NODE_TYPES_WITH_REFS.includes(node.nodeType)) {
      count++;
      return;
    }

    if (node.content) {
      count += getNumberOfRefsInRichText(node.content);
      return;
    }
  });

  return count;
};


let cachedContentTypes: CollectionProp<ContentTypeProps> | undefined
export const getContentTypes = async (cma: PlainClientAPI) => {
  if (!cachedContentTypes) {
    cachedContentTypes = await cma.contentType.getMany({
      query: {
        limit: 100,
      },
    });
  }

  return cachedContentTypes as CollectionProp<ContentTypeProps>
}