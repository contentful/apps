import { Modal, Paragraph, Spinner, Flex } from '@contentful/f36-components';

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
}

export const LoadingModal = ({ isOpen, message = 'Processing...' }: LoadingModalProps) => {
  return (
    <Modal
      isShown={isOpen}
      onClose={() => {}}
      size="medium"
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEscapePress={false}>
      {() => (
        <>
          <Modal.Header title="Processing" />
          <Modal.Content>
            <Flex alignItems="center" gap="spacingM">
              <Spinner size="small" />
              <Paragraph marginBottom="none">{message}</Paragraph>
            </Flex>
          </Modal.Content>
        </>
      )}
    </Modal>
  );
};
