import { Note, Paragraph } from '@contentful/f36-components';

interface ErrorDisplayProps {
  error: Error | null;
}

export const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  return (
    <Note variant="negative" title="Error loading entries">
      <Paragraph>{error?.message}</Paragraph>
    </Note>
  );
};
