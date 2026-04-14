import { Button, Modal, Paragraph, Text } from '@contentful/f36-components';

interface MappingReviewAssignModalProps {
  isOpen: boolean;
  /** Selected document text or asset display name, depending on how the modal was opened. */
  valueLabel: string;
  onClose: () => void;
}

export const MappingReviewAssignModal = ({
  isOpen,
  valueLabel,
  onClose,
}: MappingReviewAssignModalProps) => {
  return (
    <Modal isShown={isOpen} onClose={onClose} size="medium" shouldCloseOnOverlayClick>
      {() => (
        <>
          <Modal.Header title="Assign to field" onClose={onClose} />
          <Modal.Content>
            <Text
              as="p"
              marginBottom="spacingS"
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {valueLabel || '—'}
            </Text>
            <Paragraph marginBottom="none">
              Field selection will be available in a future step.
            </Paragraph>
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={onClose} variant="primary">
              Close
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
