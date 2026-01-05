import React from 'react';
import { Modal, Paragraph, Spinner, Skeleton, Flex } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

interface LoadingModalProps {
  isOpen: boolean;
  step?: 'reviewingContentTypes' | 'creatingEntries';
  title: string;
  entriesCount?: number;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  step,
  title,
  entriesCount,
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
            {step === 'reviewingContentTypes' ? (
              <>
                <Flex
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  gap="spacingM"
                  padding="spacingXl">
                  <Spinner size="large" variant="primary" />
                  <Paragraph color="gray700" style={{ textAlign: 'center' }}>
                    Reviewing content types and your document
                  </Paragraph>
                </Flex>
              </>
            ) : (
              <>
                <Paragraph marginBottom="spacingM" color="gray700">
                  {entriesCount
                    ? `Creating ${entriesCount} ${entriesCount === 1 ? 'entry' : 'entries'}...`
                    : 'Creating entries...'}
                </Paragraph>
                <Skeleton.Container>
                  <Skeleton.BodyText numberOfLines={4} />
                </Skeleton.Container>
              </>
            )}
          </Modal.Content>
        </>
      )}
    </Modal>
  );
};
