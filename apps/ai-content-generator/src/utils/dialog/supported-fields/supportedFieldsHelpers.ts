import { documentToPlainTextString } from '@contentful/rich-text-plain-text-renderer';
import {
  Field,
  SupportedFieldTypes,
  SupportedFieldsOutput,
} from '@hooks/dialog/useSupportedFields';
import { ContentFields, EntryProps } from 'contentful-management';
import { FieldLocales } from '@locations/Dialog';
import { LocaleNames } from '@providers/generatorProvider';
import { ContentTypeFieldValidation } from 'contentful-management/types';

/**
 * This creates the size validation for the field
 * If no custom size validation exists, use the default character length for the field type
 * as listed in our technical limits: https://www.contentful.com/developers/docs/technical-limits/.
 * If a custom max length exists, use that instead of the default.
 * @param fieldValidations
 * @param fieldType
 * @returns ContentTypeFieldValidation
 */
const createSizeValidation = (
  fieldValidations: ContentTypeFieldValidation[] | undefined,
  fieldType: string
): ContentTypeFieldValidation => {
  const DEFAULT_CHAR_LENGTH = {
    [SupportedFieldTypes.RICH_TEXT]: 200000,
    [SupportedFieldTypes.SYMBOL]: 256,
    [SupportedFieldTypes.TEXT]: 50000,
  };
  const defaultMax = DEFAULT_CHAR_LENGTH[fieldType as SupportedFieldTypes];

  const customSizeValidation = fieldValidations?.find((validation) => validation?.size) || {
    size: { max: defaultMax },
  };

  if (customSizeValidation.size && !customSizeValidation.size?.max) {
    customSizeValidation.size.max = defaultMax;
  }

  return customSizeValidation;
};

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
    sizeValidation: createSizeValidation(field.validations, field.type),
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
 * A reducer function that checks if a field is a supported type, iterates through its supported locales,
 * determines whether it has content, and assigns the field to the correct column.
 *
 * TODO: Handle the case where the field is empty
 * TODO: Support storing fields for both Source and Output
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

    if (isSupportedFieldType) {
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
