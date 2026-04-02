import { useState } from 'react';
import { Button, Flex, Heading, Layout, Paragraph } from '@contentful/f36-components';
import Splitter from './Splitter';
import { PreviewPayload } from '@types';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';

interface PreviewPageViewProps {
  payload: PreviewPayload;
  onCancel: () => void;
}

export const PreviewPageView = ({ payload, onCancel }: PreviewPageViewProps) => {
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false);

  const rawTitle = payload.normalizedDocument?.title as string | undefined;
  const title = rawTitle?.trim() ? rawTitle : 'Selected document';

  return (
    <>
      <Layout.Header title="Preview">
        <Flex justifyContent="space-between" alignItems="center" marginTop="spacingS">
          <Heading marginBottom="none">Create from document "{title}"</Heading>
          <Button
            variant="transparent"
            size="small"
            onClick={() => setIsConfirmCancelModalOpen(true)}
            aria-label="Cancel preview">
            Cancel
          </Button>
        </Flex>
      </Layout.Header>
      <Splitter marginTop="spacingS" />
      <Layout.Body>
        <Paragraph>Preview</Paragraph>
      </Layout.Body>
      <ConfirmCancelModal
        isOpen={isConfirmCancelModalOpen}
        onConfirm={onCancel}
        onCancel={() => setIsConfirmCancelModalOpen(false)}
      />
    </>
  );
};
