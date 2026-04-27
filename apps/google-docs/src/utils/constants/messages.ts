export const ERROR_MESSAGES = {
  NO_API_KEY: 'OpenAI API key is not configured. Please configure it in the app settings.',
  NO_DOCUMENT: 'Please select a document',
  NO_CONTENT_TYPE: 'Please select at least one content type',
  CREATE_ENTRIES_ERROR: 'No entries were created, please try again.',
  GENERIC_ERROR:
    'This preview could not be completed. If your Google Drive connection has expired, try reconnecting your account and starting again.',
} as const;

export const SUCCESS_MESSAGES = {
  ENTRIES_CREATED: 'Successfully created entries from document!',
} as const;
