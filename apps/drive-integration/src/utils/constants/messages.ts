export const ERROR_MESSAGES = {
  AI_ACCESS_DENIED:
    'AI features are currently disabled for this space or organization. Contact your Contentful administrator to enable.',
  NO_API_KEY: 'OpenAI API key is not configured. Please configure it in the app settings.',
  NO_DOCUMENT: 'Please select a document',
  NO_CONTENT_TYPE: 'Please select at least one content type',
  CREATE_ENTRIES_ERROR: 'No entries were created, please try again.',
  GENERIC_ERROR: 'This preview could not be completed. Please start again.',
  GOOGLE_DRIVE_AUTH_ERROR:
    'Your Drive connection has expired or is no longer valid. Reconnect your account to continue generating a preview.',
  GOOGLE_DOCS_NOT_FOUND:
    'Google Doc not found. Make sure the document exists and your Google account has access to it.',
  AI_SERVICE_UNAVAILABLE:
    'The AI service is temporarily unavailable. Please try again in a few minutes.',
} as const;

export const SUCCESS_MESSAGES = {
  ENTRIES_CREATED: 'Successfully created entries from document!',
} as const;
