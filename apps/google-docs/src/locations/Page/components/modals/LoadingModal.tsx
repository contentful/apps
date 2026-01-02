import React from 'react';
import { Modal, Paragraph, Flex, Spinner } from '@contentful/f36-components';

interface LoadingModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  title = 'Preparing your preview',
  message = 'Reviewing content types and your document',
}) => {
  return (
    <Modal
      isShown={isOpen}
      onClose={() => {}}
      size="medium"
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEscapePress={false}>
      {() => (
        <>
          <Modal.Header title={title} />
          <Modal.Content>
            <Flex
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              gap="spacingM"
              padding="spacingXl">
              <Spinner size="large" variant="primary" />
              <Paragraph color="gray700" style={{ textAlign: 'center' }}>
                {message}
              </Paragraph>
            </Flex>
          </Modal.Content>
        </>
      )}
    </Modal>
  );
};
