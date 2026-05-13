import { Note, Paragraph } from '@contentful/f36-components';

interface ErrorDisplayProps {
  error: unknown;
}

// CMA errors that cross the iframe postMessage bridge lose their Error
// prototype and arrive as plain objects like { code, message }. Handle both
// real Errors and that bridge-flattened shape so we don't fall through to
// "Unknown error" for any error with a usable message.
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return 'Unknown error';
};

export const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  return (
    <Note variant="negative" title="Error loading entries">
      <Paragraph>{getErrorMessage(error)}</Paragraph>
    </Note>
  );
};
