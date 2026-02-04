import React, { useMemo } from 'react';
import { Modal, Paragraph, Skeleton, Flex } from '@contentful/f36-components';
import { useSequentialMessages } from '../../../../hooks/useSequentialMessages';
import tokens, { ColorTokens } from '@contentful/f36-tokens';
import { css, keyframes } from '@emotion/css';

const shimmerAnimation = keyframes`
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 0% 100%;
  }
`;

const fadeInUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(4px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const styles = {
  loadingContainer: css({
    minWidth: 300,
    border: `1px dashed ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusSmall,
  }),
  verticalBar: css({
    width: '3px',
    borderRadius: '16px',
    background:
      'linear-gradient(153deg, #1872E5 0%, #8C2EEA 12.5%, #E65325 25%, #EAAF09 37.5%, #1872E5 50%, #8C2EEA 62.5%, #E65325 75%, #EAAF09 87.5%, #1872E5 100%)',
    backgroundSize: '100% 200%',
    animation: `${shimmerAnimation} 3s linear infinite`,
    flexShrink: 0,
  }),
  message: css({
    animation: `${fadeInUp} 0.4s ease-out`,
  }),
};

const getMessageColor = (index: number, totalMessages: number): ColorTokens => {
  if (index === totalMessages - 1) {
    return 'gray900';
  } else if (index === totalMessages - 2) {
    return 'gray500';
  }
  return 'gray400';
};

interface LoadingModalProps {
  isOpen: boolean;
  step?: 'reviewingContentTypes' | 'creatingEntries';
  title: string;
  entriesCount?: number;
  contentTypeCount?: number;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  step,
  title,
  entriesCount,
  contentTypeCount,
}) => {
  const messages = useMemo(() => {
    if (step === 'reviewingContentTypes') {
      const baseMessages = [
        'Fetching Google document...',
        'Analyzing document structure...',
        'Processing document with AI...',
        contentTypeCount
          ? `Analyzing content for ${contentTypeCount} content type${
              contentTypeCount === 1 ? '' : 's'
            }...`
          : 'Analyzing content for content types...',
        'Generating preview entries...',
      ];
      return baseMessages;
    }
    return [];
  }, [step, contentTypeCount]);

  const visibleMessages = useSequentialMessages({
    messages,
    isActive: isOpen && step === 'reviewingContentTypes',
  });

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
              <Flex justifyContent="center">
                <Flex
                  flexDirection="row"
                  alignItems="stretch"
                  gap="spacingS"
                  padding="spacingM"
                  className={styles.loadingContainer}>
                  <div className={styles.verticalBar} />
                  <Flex flex={1} flexDirection="column" gap="spacingS" alignItems="flex-start">
                    {visibleMessages.map((message, index) => (
                      <Paragraph
                        key={message}
                        fontColor={getMessageColor(index, visibleMessages.length)}
                        marginBottom="none"
                        className={styles.message}>
                        {message}
                      </Paragraph>
                    ))}
                  </Flex>
                </Flex>
              </Flex>
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
