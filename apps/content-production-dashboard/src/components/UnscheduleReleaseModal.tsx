import { useState } from 'react';
import { Modal, Button, Flex, Text, Note } from '@contentful/f36-components';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import type { ReleaseWithScheduledAction } from '../utils/fetchReleases';

interface CancelReleaseModalProps {
  isShown: boolean;
  onClose: () => void;
  release: ReleaseWithScheduledAction | null;
  sdk: HomeAppSDK | PageAppSDK;
  onSuccess: () => void;
  testId: string;
}

export const UnscheduleReleaseModal = ({
  isShown,
  onClose,
  release,
  sdk,
  onSuccess,
  testId,
}: CancelReleaseModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUnschedule = async () => {
    if (!release) return;

    setIsSubmitting(true);

    try {
      await sdk.cma.scheduledActions.delete({
        spaceId: sdk.ids.space,
        scheduledActionId: release.scheduledActionId,
      });

      onSuccess();
    } catch (err) {
      sdk.notifier.error('Unable to cancel release');
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  if (!release) return null;

  return (
    <Modal isShown={isShown} onClose={onClose} size="medium" testId={testId}>
      {() => (
        <>
          <Modal.Header title="Cancel Release" onClose={onClose} />
          <Modal.Content>
            <Flex flexDirection="column" gap="spacingM">
              <Text>
                Are you sure you want to unschedule this release? This action cannot be undone.
              </Text>
            </Flex>
          </Modal.Content>
          <Modal.Controls>
            <Flex justifyContent="flex-end" gap="spacingS">
              <Button variant="secondary" onClick={onClose} isDisabled={isSubmitting}>
                No, keep scheduled
              </Button>
              <Button
                variant="negative"
                onClick={handleUnschedule}
                isDisabled={isSubmitting}
                isLoading={isSubmitting}>
                Yes, unschedule release
              </Button>
            </Flex>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
