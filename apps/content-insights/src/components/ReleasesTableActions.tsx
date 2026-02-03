import { useState } from 'react';
import { Menu, IconButton } from '@contentful/f36-components';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { DotsThreeIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import type { ReleaseWithScheduledAction } from '../utils/fetchReleases';
import { RescheduleModal } from './RescheduleModal';
import { UnscheduleReleaseModal } from './UnscheduleReleaseModal';

interface ReleasesTableActionsProps {
  release: ReleaseWithScheduledAction;
  sdk: HomeAppSDK | PageAppSDK;
  onActionSuccess: () => void;
}

export const ReleasesTableActions = ({
  release,
  sdk,
  onActionSuccess,
}: ReleasesTableActionsProps) => {
  const [rescheduleRelease, setRescheduleRelease] = useState<ReleaseWithScheduledAction | null>(
    null
  );
  const [unscheduleRelease, setUnscheduleRelease] = useState<ReleaseWithScheduledAction | null>(
    null
  );

  const handleViewRelease = (release: ReleaseWithScheduledAction) => {
    window.open(release.viewUrl, '_blank', 'noopener,noreferrer');
  };

  const handleRescheduleSuccess = () => {
    onActionSuccess();
    sdk.notifier.success('Release rescheduled successfully');
  };

  const handleUnscheduleReleaseSuccess = () => {
    onActionSuccess();
    sdk.notifier.success('Release cancelled successfully');
  };

  return (
    <>
      <Menu>
        <Menu.Trigger>
          <IconButton
            icon={<DotsThreeIcon color={tokens.gray500} />}
            aria-label="toggle menu"
            size="small"
            style={{
              padding: tokens.spacing2Xs,
              margin: 0,
            }}
          />
        </Menu.Trigger>
        <Menu.List>
          <Menu.Item onClick={() => handleViewRelease(release)}>View release</Menu.Item>
          <Menu.Item onClick={() => setRescheduleRelease(release)}>Reschedule release</Menu.Item>
          <Menu.Item onClick={() => setUnscheduleRelease(release)}>Unschedule release</Menu.Item>
        </Menu.List>
      </Menu>
      <RescheduleModal
        isShown={rescheduleRelease !== null}
        onClose={() => setRescheduleRelease(null)}
        release={rescheduleRelease}
        sdk={sdk}
        onSuccess={handleRescheduleSuccess}
        testId="reschedule-modal"
      />
      <UnscheduleReleaseModal
        isShown={unscheduleRelease !== null}
        onClose={() => setUnscheduleRelease(null)}
        release={unscheduleRelease}
        sdk={sdk}
        onSuccess={handleUnscheduleReleaseSuccess}
        testId="unschedule-modal"
      />
    </>
  );
};
