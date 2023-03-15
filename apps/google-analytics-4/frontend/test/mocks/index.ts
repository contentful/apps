import { ContentTypeProps } from 'contentful-management';
import {
  ServiceAccountKey,
  ServiceAccountKeyId,
  AllContentTypes,
  ContentTypes,
  EditorInterfaceAssignment,
} from 'types';

export { mockCma } from './mockCma';
export { mockSdk } from './mockSdk';

export const validServiceKeyFile: ServiceAccountKey = {
  type: 'service_account',
  project_id: 'PROJECT_ID',
  private_key_id: 'PRIVATE_KEY_ID',
  private_key: '----- PRIVATE_KEY-----',
  client_email: 'example4@PROJECT_ID.iam.gserviceaccount.com',
  client_id: 'CLIENT_ID',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:
    'https://www.googleapis.com/robot/v1/metadata/x509/example4%40PROJECT_ID.iam.gserviceaccount.com',
};

export const validServiceKeyId: ServiceAccountKeyId = {
  id: validServiceKeyFile.private_key_id,
  clientId: validServiceKeyFile.client_id,
  clientEmail: validServiceKeyFile.client_id,
  projectId: validServiceKeyFile.project_id,
};

export const mockContentTypes: ContentTypes = {
  course: {
    slugField: 'slug',
    urlPrefix: '/about',
  },
  category: {
    slugField: 'title',
    urlPrefix: '',
  },
  layout: {
    slugField: 'title',
    urlPrefix: '',
  },
};

export const mockAllContentTypesIncomplete: AllContentTypes = {
  layout: {
    name: 'Layout',
    fields: [
      {
        id: 'title',
        name: 'Title',
        type: 'Symbol',
      },
      {
        id: 'slug',
        name: 'Slug',
        type: 'Symbol',
      },
    ],
  },
  category: {
    name: 'Category',
    fields: [
      {
        id: 'slug',
        name: 'Slug',
        type: 'Symbol',
      },
    ],
  },
};

export const mockAllContentTypesComplete: AllContentTypes = {
  layout: {
    name: 'Layout',
    fields: [
      {
        id: 'title',
        name: 'Title',
        type: 'Symbol',
      },
      {
        id: 'slug',
        name: 'Slug',
        type: 'Symbol',
      },
    ],
  },
  category: {
    name: 'Category',
    fields: [
      {
        id: 'title',
        name: 'Title',
        type: 'Symbol',
      },
      {
        id: 'slug',
        name: 'Slug',
        type: 'Symbol',
      },
    ],
  },
  course: {
    name: 'Course',
    fields: [
      {
        id: 'title',
        name: 'Title',
        type: 'Symbol',
      },
      {
        id: 'slug',
        name: 'Slug',
        type: 'Symbol',
      },
    ],
  },
};

export const mockEditorInterfaceIncomplete: EditorInterfaceAssignment = {
  category: {
    sidebar: {
      position: 1,
    },
  },
  course: {
    sidebar: {
      position: 1,
    },
  },
};

export const mockEditorInterfaceComplete: EditorInterfaceAssignment = {
  ...mockEditorInterfaceIncomplete,
  layout: {
    sidebar: {
      position: 1,
    },
  },
};

export const mockContentTypeItems: ContentTypeProps[] = [
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'abc123',
        },
      },
      id: 'layout',
      type: 'ContentType',
      createdAt: '2023-01-18T01:12:58.781Z',
      updatedAt: '2023-03-14T21:34:26.800Z',
      environment: {
        sys: {
          id: 'abc123',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      version: 4,
    },
    displayField: 'title',
    name: 'Layout',
    description: '',
    fields: [
      {
        id: 'title',
        name: 'Title',
        type: 'Symbol',
        localized: false,
        required: true,
        validations: [],
        disabled: false,
        omitted: false,
      },
      {
        id: 'slug',
        name: 'Slug',
        type: 'Symbol',
        localized: false,
        required: true,
        validations: [],
        disabled: false,
        omitted: false,
      },
      {
        disabled: false,
        id: 'duration',
        localized: false,
        name: 'Duration',
        omitted: false,
        required: false,
        type: 'Integer',
        validations: [],
      },
    ],
  },
];
