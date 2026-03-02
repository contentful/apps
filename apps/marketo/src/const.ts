export const CREDENTIAL_VALIDATION: { id: string; message: string }[] = [
  { id: 'clientId', message: 'Enter a valid Client ID' },
  { id: 'clientSecret', message: 'Enter a valid Client Secret' },
  { id: 'munchkinId', message: 'Enter a valid Munchkin ID' },
];

export const GET_FORMS_APP_ACTION_ID = 'getMarketoFormsAction';

export const INVALID_CREDENTIALS_RESPONSE =
  'Marketo authentication failed, check your credentials and try again.';

export const INVALID_MUNCHKIN_RESPONSE = 'Check your Marketo Munchkin ID.';

export const VALID_CREDENTIALS_RESPONSE = 'Your Marketo credentials are valid.';

export const CONFIG_SAVE_REQUIRED_FIELDS_MESSAGE =
  'Please fill in all required fields with valid values before saving.';

export const CONFIG_SAVE_FAILED_MESSAGE = 'Configuration could not be saved.';

export const TEST_CONNECTION_REQUIRED_FIELDS_MESSAGE =
  'Please fill in all required fields before testing the connection.';

export const INSTALL_APP_FIRST_MESSAGE = 'Please install the app first.';
