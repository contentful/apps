import { documentToPlainTextString } from '@contentful/rich-text-plain-text-renderer';
import { SupportedFieldTypes, SupportedFieldsOutput } from '@hooks/dialog/useSupportedFields';
import { ContentFields, EntryProps } from 'contentful-management';

const formatField = (field: ContentFields, entry: EntryProps, targetLocale: string) => {
  const formattedField = {
    name: field.name,
    data: entry.fields[field.id] ? entry.fields[field.id][targetLocale] : '',
  };

  if (field.type === 'RichText') {
    formattedField.data = documentToPlainTextString(formattedField.data);
  }

  return formattedField;
};

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
