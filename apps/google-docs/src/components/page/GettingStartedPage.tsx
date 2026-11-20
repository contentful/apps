import { Box, Button, Heading, Paragraph } from '@contentful/f36-components';
import { ArrowLineRightIcon } from '@contentful/f36-icons';

interface GettingStartedPageProps {
  onSelectFile: () => void;
}

export const GettingStartedPage = ({ onSelectFile }: GettingStartedPageProps) => {
  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '100vh',
        padding: '80px 20px',
        background: '#f7f9fa',
      }}>
      <Box
        style={{
          width: '100%',
          maxWidth: '600px',
          padding: '48px 40px',
          background: '#fff',
          border: '1px solid #d3dce0',
          borderRadius: '6px',
          textAlign: 'center',
        }}>
        <Heading
          as="h1"
          marginBottom="spacingM"
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#1d2430',
            lineHeight: '28px',
          }}>
          Google Drive Integration
        </Heading>
        <Paragraph
          marginBottom="spacingXl"
          style={{
            fontSize: '14px',
            color: '#536171',
            lineHeight: '20px',
            marginBottom: '32px',
          }}>
          Create entries using existing content types from a Google Drive file. Get started by
          selecting the file you would like to use.
        </Paragraph>
        <Button variant="primary" onClick={onSelectFile} endIcon={<ArrowLineRightIcon />}>
          Select your file
        </Button>
      </Box>
    </Box>
  );
};
