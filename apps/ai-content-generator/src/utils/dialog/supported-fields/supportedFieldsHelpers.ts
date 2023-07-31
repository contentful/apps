import { documentToPlainTextString } from '@contentful/rich-text-plain-text-renderer';
import {
  Field,
  SupportedFieldTypes,
  SupportedFieldsOutput,
} from '@hooks/dialog/useSupportedFields';
import { ContentFields, EntryProps } from 'contentful-management';
import { FieldLocales } from '@locations/Dialog';
import { LocaleNames } from '@providers/generatorProvider';

/**
 * This formats an entry's field into an easy-to-use object.
 * @param field
 * @param entry
 * @param locale
 * @param localeNames
 * @returns Field
 */
const formatField = (
  field: ContentFields,
  entry: EntryProps,
  locale: string,
  localeNames: LocaleNames
): Field => {
  const formattedField = {
    id: field.id,
    key: `${field.id}:${locale}`,
    name: `${field.name} - ${localeNames[locale]}`,
    data: entry.fields[field.id] ? entry.fields[field.id][locale] : '',
    locale: locale,
  };

  if (field.type === 'RichText') {
    formattedField.data = documentToPlainTextString(formattedField.data);
  }

  return formattedField;
};

/**
 * A reducer function that checks if a field is a supported type, iterates through its supported locales,
 * determines whether it has content, and assigns the field to the correct column.
 *
 * TODO: Handle the case where the field is empty
 * TODO: Support storing fields for both Source and Output
 * @param entry
 * @param supportedFields
 * @param fieldLocales
 * @param localeNames
 * @returns
 */
const isSupported = (
  entry: EntryProps,
  supportedFields: SupportedFieldTypes[],
  fieldLocales: FieldLocales,
  localeNames: LocaleNames
) => {
  return (fieldAcc: SupportedFieldsOutput, field: ContentFields) => {
    const isSupportedFieldType = supportedFields.includes(field.type as SupportedFieldTypes);

    if (isSupportedFieldType) {
      fieldLocales[field.id].forEach((locale) => {
        const hasContent = entry.fields[field.id]?.[locale];
        const formattedField = formatField(field, entry, locale, localeNames);

        if (hasContent) {
          fieldAcc.supportedFieldsWithContent.push(formattedField);
        }
        fieldAcc.allSupportedFields.push(formattedField);
      });
    }

    return fieldAcc;
  };
};

export { isSupported };
