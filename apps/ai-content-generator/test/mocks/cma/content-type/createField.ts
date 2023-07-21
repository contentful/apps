import { ContentFields, ContentTypeFieldValidation } from 'contentful-management';
import { generateRandomString } from '@test/mocks';
import { Items } from '@contentful/app-sdk';

interface FieldData {
  name: string;
  type: string;
  localized?: boolean;
  required?: boolean;
  validations?: ContentTypeFieldValidation[];
  disabled?: boolean;
  omitted?: boolean;
  items?: Items;
}

const createField = (data: FieldData): ContentFields => {
  const { name, type, localized, required, validations, disabled, omitted, items } = data;

  return {
    id: generateRandomString(64),
    name: name,
    type: type,
    localized: localized || false,
    required: required || false,
    validations: validations,
    disabled: disabled || false,
    omitted: omitted || false,
    items: items,
  };
};

export { createField };
export type { FieldData };
