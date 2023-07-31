import { useMemo } from 'react';
import { isSupported } from '@utils/dialog/supported-fields/supportedFieldsHelpers';
import useEntryAndContentType from './useEntryAndContentType';
import { FieldLocales } from '@locations/Dialog';
import { LocaleNames } from '@providers/generatorProvider';

interface Field {
  id: string;
  key: string;
  name: string;
  data: string;
  locale: string;
  language: string;
  isDefaultLocale: boolean;
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

export type SupportedFieldsOutput = {
  allSupportedFields: Field[];
  supportedFieldsWithContent: Field[];
};

/**
 * This hook is used to get the fields of an entry that are supported by the feature.
 * We need both the entry and the content type to get the supported fields. Only the
 * content type has the information about whether the field is a rich text field or not.
 *
 * @param entryId Contentful entry id
 * @param supportedFields A list of supported fields
 * @param fieldLocales Fields and their localizations
 * @param localeNames Shorthand locales to readable language names
 * @param defaultLocale Default locale for the entry
 * @returns
 */
const useSupportedFields = (
  entryId: string,
  supportedFields: SupportedFieldTypes[],
  fieldLocales: FieldLocales,
  localeNames: LocaleNames,
  defaultLocale: string
) => {
  const { entry, contentType } = useEntryAndContentType(entryId);
  const fields = useMemo(() => {
    if (entry && contentType) {
      const validatedFields: SupportedFieldsOutput = contentType.fields.reduce(
        isSupported(entry, supportedFields, fieldLocales, localeNames, defaultLocale),
        {
          supportedFieldsWithContent: [],
          allSupportedFields: [],
        }
      );

      return validatedFields;
    }

    return { supportedFieldsWithContent: [], allSupportedFields: [] };
  }, [entry, contentType, supportedFields, fieldLocales, localeNames, defaultLocale]);

  return { ...fields };
};

export default useSupportedFields;
export { SupportedFieldTypes, RichTextFields, TextFields, TranslatableFields };
export type { Field };
