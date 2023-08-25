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
 * @param defaultLocale
 * @returns Field
 */
const formatField = (
  field: ContentFields,
  entry: EntryProps,
  locale: string,
  localeNames: LocaleNames,
  defaultLocale: string
): Field => {
  const formattedField = {
    id: field.id,
    key: `${field.id}:${locale}`,
    name: `${field.name} - ${localeNames[locale]}`,
    data: entry.fields[field.id] ? entry.fields[field.id][locale] : '',
    locale: locale,
    language: localeNames[locale],
    sizeValidation:
      field.validations?.find((validation) =>
        Object.prototype.hasOwnProperty.call(validation, 'size')
      ) || null,
    isDefaultLocale: defaultLocale === locale,
  };

  if (field.type === 'RichText') {
    formattedField.data = documentToPlainTextString(formattedField.data);
  }

  return formattedField;
};

/**
 * This sorts the field options so that the default locale is first,
 * then alphabetically by language name
 * @param a
 * @param b
 * @returns
 */
const sortFieldOptionsByLanguage = (a: Field, b: Field) => {
  // Default should be listed first
  if (a.isDefaultLocale) {
    return -1;
  }

  if (b.isDefaultLocale) {
    return 1;
  }

  return a.name.localeCompare(b.name);
};

/**
 * A reducer function that checks if a field is a supported type and is visible, iterates through its supported locales,
 * determines whether it has content, and assigns the field to the correct column.
 *
 * @param entry
 * @param supportedFields
 * @param fieldLocales
 * @param localeNames
 * @param defaultLocale
 * @returns
 */
const isSupported = (
  entry: EntryProps,
  supportedFields: SupportedFieldTypes[],
  fieldLocales: FieldLocales,
  localeNames: LocaleNames,
  defaultLocale: string
) => {
  return (fieldAcc: SupportedFieldsOutput, field: ContentFields) => {
    const isSupportedFieldType = supportedFields.includes(field.type as SupportedFieldTypes);
    const isFieldVisible = !field.disabled;

    if (isSupportedFieldType && isFieldVisible) {
      const fieldsWithContent = [] as Field[];
      const allFields = [] as Field[];

      fieldLocales[field.id].forEach((locale) => {
        const hasContent = entry.fields[field.id]?.[locale];
        const formattedField = formatField(field, entry, locale, localeNames, defaultLocale);

        if (hasContent) {
          fieldsWithContent.push(formattedField);
        }
        allFields.push(formattedField);
      });

      const sortedFieldsWithContent = fieldsWithContent.sort(sortFieldOptionsByLanguage);
      const sortedAllFields = allFields.sort(sortFieldOptionsByLanguage);

      fieldAcc.supportedFieldsWithContent = [
        ...fieldAcc.supportedFieldsWithContent,
        ...sortedFieldsWithContent,
      ];
      fieldAcc.allSupportedFields = [...fieldAcc.allSupportedFields, ...sortedAllFields];
    }

    return fieldAcc;
  };
};

export { isSupported };
