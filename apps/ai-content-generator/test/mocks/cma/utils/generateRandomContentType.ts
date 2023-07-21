import { ContentTypeProps } from 'contentful-management/types';
import { createSys } from '../content-type/createSys';
import { FieldData, createField } from '../content-type/createField';
import { generateRandomString } from '@test/mocks';

const fields: FieldData[] = [
  {
    name: generateRandomString(24),
    type: 'Symbol',
  },
  {
    name: generateRandomString(24),
    type: 'Symbol',
  },
  {
    name: generateRandomString(24),
    type: 'RichText',
  },
  {
    name: generateRandomString(24),
    type: 'Link',
  },
  {
    name: generateRandomString(24),
    type: 'Text',
    omitted: true,
  },
];

const generateRandomContentType = (): ContentTypeProps => ({
  sys: createSys(),
  displayField: 'title',
  name: 'Page',
  description: '',
  fields: fields.map((field) => createField(field)),
});

export { generateRandomContentType };
