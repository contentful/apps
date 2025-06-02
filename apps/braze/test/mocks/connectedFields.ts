import { KeyValueMap } from 'contentful-management';

export const mockConnectedFields = {
  'en-US': {
    ['entry-id']: [
      {
        fieldId: 'title',
        contentBlockId: 'contentBlockA',
      },
      {
        fieldId: 'author',
        contentBlockId: 'contentBlockB',
      },
    ],
  },
};

export const mockSingleConnectedField = {
  'en-US': {
    ['entry-id']: [
      {
        fieldId: 'title',
        contentBlockId: 'contentBlockA',
      },
    ],
  },
};

export const mockConfigEntryWithLocalizedFields: KeyValueMap = {
  'en-US': {
    'entry-id': [
      { fieldId: 'name', locale: 'en-US', contentBlockId: 'block1' },
      { fieldId: 'name', locale: 'en-AU', contentBlockId: 'block2' },
      {
        fieldId: 'description',
        contentBlockId: 'block3',
        error: { status: 500, message: 'Internal Server Error' },
      },
    ],
  },
};

export const mockConfigEntryWithError: KeyValueMap = {
  'en-US': {
    'entry-id': [
      {
        fieldId: 'name',
        locale: 'en-US',
        contentBlockId: 'block1',
        error: {
          status: 401,
          message: 'Invalid API key: ',
        },
      },
      { fieldId: 'name', locale: 'en-AU', contentBlockId: 'block2' },
      { fieldId: 'description', contentBlockId: 'block3' },
    ],
  },
};

export const mockConfigEntryWithErrors: KeyValueMap = {
  'en-US': {
    'entry-id': [
      {
        fieldId: 'name',
        locale: 'en-US',
        contentBlockId: 'block1',
        error: {
          status: 401,
          message: 'Invalid API key: ',
        },
      },
      { fieldId: 'name', locale: 'en-AU', contentBlockId: 'block2' },
      {
        fieldId: 'description',
        contentBlockId: 'block3',
        error: {
          status: 401,
          message: 'Invalid API key: ',
        },
      },
    ],
  },
};
