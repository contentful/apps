import { Box, Heading, Paragraph } from '@contentful/f36-components';

interface DocumentPreviewProps {
  title: string | null;
  html: string | null;
  isDocxRendered: boolean;
  previewRef?: React.RefObject<HTMLDivElement>;
}

export const DocumentPreview = ({
  title,
  html,
  isDocxRendered,
  previewRef,
}: DocumentPreviewProps) => {
  if (!title) return null;

  if (html && !isDocxRendered) {
    return (
      <Box marginTop="spacingL" style={{ border: '1px solid #e5e5e5', padding: '16px' }}>
        <Heading as="h3" marginBottom="spacingS">
          {title}
        </Heading>
        <Paragraph marginBottom="spacingS">Preview (HTML export):</Paragraph>
        <Box
          style={{ maxHeight: '400px', overflow: 'auto', background: '#fff' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Box>
    );
  }

  if (isDocxRendered && previewRef) {
    return (
      <Box marginTop="spacingL" style={{ border: '1px solid #e5e5e5', padding: '16px' }}>
        <Heading as="h3" marginBottom="spacingS">
          {title}
        </Heading>
        <Paragraph marginBottom="spacingS">Preview (DOCX high-fidelity render):</Paragraph>
        <Box
          ref={previewRef}
          style={{ maxHeight: '400px', overflow: 'auto', background: '#fff' }}
        />
      </Box>
    );
  }

  return null;
};
