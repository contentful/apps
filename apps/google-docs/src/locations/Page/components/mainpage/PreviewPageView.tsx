import { Button, Flex, Heading, Layout, Paragraph } from '@contentful/f36-components';
import Splitter from './Splitter';
import { PreviewPayload } from '../../../../utils/types';

interface PreviewPageViewProps {
  previewPayload: PreviewPayload;
  onCancel: () => void;
}

export const PreviewPageView = ({ previewPayload, onCancel }: PreviewPageViewProps) => {
  const title = previewPayload.title || previewPayload.documentId || 'Selected document';

  return (
    <>
      <Layout.Header title="Preview">
        <Flex justifyContent="space-between" alignItems="center" marginTop="spacingS">
          <Heading marginBottom="none">Create from document "{title}"</Heading>
          <Button variant="transparent" size="small" onClick={onCancel} aria-label="Cancel preview">
            Cancel
          </Button>
        </Flex>
      </Layout.Header>
      <Splitter marginTop="spacingS" />
      <Layout.Body>
        <Paragraph>Preview</Paragraph>
      </Layout.Body>
    </>
  );
};
