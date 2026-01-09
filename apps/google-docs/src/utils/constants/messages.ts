export const ERROR_MESSAGES = {
  NO_API_KEY: 'OpenAI API key is not configured. Please configure it in the app settings.',
  NO_DOCUMENT: 'Please select a document',
  NO_CONTENT_TYPE: 'Please select at least one content type',
  SUBMISSION_FAILED: 'Failed to generate preview',
} as const;

export const SUCCESS_MESSAGES = {
  ENTRIES_CREATED: 'Successfully created entries from document!',
} as const;
