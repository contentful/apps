import { Button, Flex, Heading, Layout, Paragraph } from '@contentful/f36-components';
import Splitter from './Splitter';

interface PreviewPageViewProps {
  title: string;
  onCancel: () => void;
}

export const PreviewPageView = ({ title, onCancel }: PreviewPageViewProps) => {
  return (
    <>
      <Layout.Header title="Preview">
        <Flex justifyContent="space-between" alignItems="center" marginTop="spacingS">
          <Heading marginBottom="none">{title}</Heading>
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
