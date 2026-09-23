import type { MarketoApiResponse, MarketoFolderRecord, MarketoFormRecord } from '../../src/types';

export const MUNCHKIN_ID = 'test-munchkin';

export const AUTH_URL = `https://${MUNCHKIN_ID}.mktorest.com/identity/oauth/token?grant_type=client_credentials&client_id=test-client-id&client_secret=test-client-secret`;
export const FORMS_URL = `https://${MUNCHKIN_ID}.mktorest.com/rest/asset/v1/forms.json?maxReturn=200`;
export const folderUrl = (folderId: number) =>
  `https://${MUNCHKIN_ID}.mktorest.com/rest/asset/v1/folder/${folderId}.json?type=Folder`;

export const mockAuthResponse = {
  access_token: 'test-access-token',
  token_type: 'Bearer',
  expires_in: 3600,
};

export const buildMarketoForm = (
  overrides: Partial<MarketoFormRecord> = {}
): MarketoFormRecord => ({
  id: 'form-1',
  name: 'Contact Form',
  url: `https://${MUNCHKIN_ID}.mktorest.com/rest/asset/v1/form/1.json`,
  status: 'approved',
  folder: { type: 'Folder', value: 100, folderName: 'Landing Pages' },
  ...overrides,
});

export const buildMarketoFolder = (
  overrides: Partial<MarketoFolderRecord> = {}
): MarketoFolderRecord => ({
  id: 100,
  name: 'Landing Pages',
  isArchive: false,
  ...overrides,
});

export const buildFormsApiResponse = (
  forms: MarketoFormRecord[]
): MarketoApiResponse<MarketoFormRecord> => ({
  success: true,
  result: forms,
});

export const buildFolderApiResponse = (
  folder: MarketoFolderRecord
): MarketoApiResponse<MarketoFolderRecord> => ({
  success: true,
  result: [folder],
});

export const jsonResponse = (body: unknown, ok = true) =>
  ({
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
  } as Response);
