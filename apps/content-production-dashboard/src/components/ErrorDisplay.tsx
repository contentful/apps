import { Button, Note, Paragraph } from '@contentful/f36-components';

interface ErrorDisplayProps {
  error: Error;
  onRetry: () => void;
}

export const ErrorDisplay = ({ error, onRetry }: ErrorDisplayProps) => {
  return (
    <Note variant="negative" title="Error loading entries">
      <Paragraph>{error.message}</Paragraph>
      <Button onClick={onRetry} variant="primary" size="small">
        Retry
      </Button>
    </Note>
  );
};
