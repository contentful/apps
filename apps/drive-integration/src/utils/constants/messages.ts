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
  APP_NOT_INSTALLED:
    'The Drive Integration app is not installed in this environment. Install it via Apps > Manage apps and try again.',
  DOCUMENT_TOO_COMPLEX:
    'This document is too large to import in one go. Try splitting it into smaller sections or reducing the number of tabs selected.',
  PROCESSING_TIMEOUT:
    'The import took too long to complete. Try a simpler document or split it into smaller sections.',
} as const;

export const SUCCESS_MESSAGES = {
  ENTRIES_CREATED: 'Successfully created entries from document!',
} as const;
