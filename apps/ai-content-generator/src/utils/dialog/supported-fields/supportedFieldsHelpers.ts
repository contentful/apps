import { documentToPlainTextString } from '@contentful/rich-text-plain-text-renderer';
import {
  Field,
  SupportedFieldTypes,
  SupportedFieldsOutput,
} from '@hooks/dialog/useSupportedFields';
import { ContentFields, EntryProps } from 'contentful-management';

/**
 * This formats an entry's field into an easy-to-use object.
 * @param field
 * @param entry
 * @param targetLocale
 * @returns Field
 */
const formatField = (field: ContentFields, entry: EntryProps, targetLocale: string): Field => {
  const formattedField = {
    name: field.name,
    data: entry.fields[field.id] ? entry.fields[field.id][targetLocale] : '',
  };

  if (field.type === 'RichText') {
    formattedField.data = documentToPlainTextString(formattedField.data);
  }

  return formattedField;
};

/**
 * A reducer function that checks if a field is supported and assigns the field
 * to the correct column.
 *
 * TODO: Handle the case where the field is empty
 * TODO: Support storing fields for both Source and Output
 * @param entry
 * @param supportedFields
 * @param locale
 * @returns
 */
const isSupported = (entry: EntryProps, supportedFields: SupportedFieldTypes[], locale: string) => {
  return (fieldAcc: SupportedFieldsOutput, field: ContentFields) => {
    const existsInEntry = entry.fields[field.id];
    if (!existsInEntry) {
      return fieldAcc;
    }

    const formattedField = formatField(field, entry, locale);

    const isSupported = supportedFields.includes(field.type as SupportedFieldTypes);
    if (isSupported) {
      fieldAcc.supportedFields.push(formattedField);
    }

    fieldAcc.fields.push(formattedField);
    return fieldAcc;
  };
};

export { isSupported };
