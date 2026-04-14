import { Button, Modal, Paragraph, Text } from '@contentful/f36-components';

interface MappingReviewExcludeModalProps {
  isOpen: boolean;
  /** Selected document text or asset display name, depending on how the modal was opened. */
  valueLabel: string;
  onClose: () => void;
}

export const MappingReviewExcludeModal = ({
  isOpen,
  valueLabel,
  onClose,
}: MappingReviewExcludeModalProps) => {
  return (
    <Modal isShown={isOpen} onClose={onClose} size="medium" shouldCloseOnOverlayClick>
      {() => (
        <>
          <Modal.Header title="Exclude from mapping" onClose={onClose} />
          <Modal.Content>
            <Text
              as="p"
              marginBottom="spacingS"
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {valueLabel || '—'}
            </Text>
            <Paragraph marginBottom="none">
              Exclusion options will be available in a future step.
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
