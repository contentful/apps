import { Button, Modal, Paragraph } from '@contentful/f36-components';

export interface ErrorModalConfig {
  title: string;
  message: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  isPrimaryActionLoading?: boolean;
}

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ErrorModalConfig;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, config }) => {
  const {
    title,
    message,
    primaryActionLabel = 'Close',
    onPrimaryAction,
    secondaryActionLabel,
    onSecondaryAction,
    isPrimaryActionLoading = false,
  } = config;
  const handlePrimaryAction = onPrimaryAction ?? onClose;
  const handleSecondaryAction = onSecondaryAction ?? onClose;

  return (
    <Modal
      isShown={isOpen}
      onClose={onClose}
      size="medium"
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEscapePress={false}>
      {() => (
        <>
          <Modal.Header title={title} />
          <Modal.Content>
            <Paragraph>{message}</Paragraph>
          </Modal.Content>
          <Modal.Controls>
            <>
              {secondaryActionLabel ? (
                <Button onClick={handleSecondaryAction} variant="secondary">
                  {secondaryActionLabel}
                </Button>
              ) : null}
              <Button
                onClick={handlePrimaryAction}
                variant="primary"
                isLoading={isPrimaryActionLoading}>
                {primaryActionLabel}
              </Button>
            </>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
