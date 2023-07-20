import { useMemo } from 'react';
import { isSupported } from '@utils/dialog/supported-fields/supportedFieldsHelpers';
import useEntryAndContentType from './useEntryAndContentType';

interface Field {
  name: string;
  data: string;
}

enum SupportedFieldTypes {
  RICH_TEXT = 'RichText',
  SYMBOL = 'Symbol',
  TEXT = 'Text',
}

const RichTextFields = [SupportedFieldTypes.RICH_TEXT];
const TextFields = [
  SupportedFieldTypes.SYMBOL,
  SupportedFieldTypes.TEXT,
  SupportedFieldTypes.RICH_TEXT,
];
const TranslatableFields = [
  SupportedFieldTypes.RICH_TEXT,
  SupportedFieldTypes.SYMBOL,
  SupportedFieldTypes.TEXT,
];

export type SupportedFieldsOutput = { supportedFields: Field[]; fields: Field[] };

/**
 * This hook is used to get the fields of an entry that are supported by the feature.
 * We need both the entry and the content type to get the supported fields. Only the
 * content type has the information about whether the field is a rich text field or not.
 *
 * @param entryId Contentful entry id
 * @param supportedFields A list of supported fields
 * @param targetLocale The locale to get the fields from
 * @returns
 */
const useSupportedFields = (
  entryId: string,
  supportedFields: SupportedFieldTypes[],
  targetLocale: string
) => {
  const { entry, contentType } = useEntryAndContentType(entryId);
  const fields = useMemo(() => {
    if (entry && contentType) {
      const validatedFields: SupportedFieldsOutput = contentType.fields.reduce(
        isSupported(entry, supportedFields, targetLocale),
        {
          supportedFields: [],
          fields: [],
        }
      );

      return validatedFields;
    }

    return { supportedFields: [], fields: [] };
  }, [entry, contentType, targetLocale, supportedFields]);

  return { ...fields };
};

export default useSupportedFields;
export { SupportedFieldTypes, RichTextFields, TextFields, TranslatableFields };
export type { Field };
