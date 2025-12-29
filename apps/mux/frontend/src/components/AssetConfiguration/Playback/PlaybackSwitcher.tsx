import React from 'react';
import { Flex } from '@contentful/f36-components';
import { MuxContentfulObject } from '../../../util/types';
import { PlaybackPolicySelector } from '../PlaybackPolicySelector';
import { PolicyType } from '../../../util/types';

interface PlaybackSwitcherProps {
  value: MuxContentfulObject;
  onSwapPlaybackIDs: (policy: PolicyType) => void;
  enableSignedUrls: boolean;
  enableDRM?: boolean;
}

function isUsingSigned(value: MuxContentfulObject): boolean {
  return !!(value && value.signedPlaybackId && !value.playbackId);
}

function isUsingDRM(value: MuxContentfulObject): boolean {
  return !!(value && value.drmPlaybackId);
}

function getCurrentPolicy(value: MuxContentfulObject): PolicyType {
  if (value?.pendingActions?.create) {
    const playbackCreateAction = value.pendingActions.create.find(
      (action) => action.type === 'playback'
    );
    if (playbackCreateAction) {
      return playbackCreateAction.data?.policy as PolicyType;
    }
  }
  if (isUsingDRM(value)) return 'drm';
  if (isUsingSigned(value)) return 'signed';
  return 'public';
}

export const PlaybackSwitcher: React.FC<PlaybackSwitcherProps> = ({
  value,
  onSwapPlaybackIDs,
  enableSignedUrls,
  enableDRM = false,
}) => {
  const selectedPolicy = getCurrentPolicy(value);

  return (
    <Flex>
      <PlaybackPolicySelector
        selectedPolicies={[selectedPolicy]}
        onPoliciesChange={(policies) => {
          const newPolicy = policies[0];
          if (newPolicy !== selectedPolicy) {
            onSwapPlaybackIDs(newPolicy);
          }
        }}
        enableSignedUrls={enableSignedUrls}
        enableDRM={enableDRM}
      />
    </Flex>
  );
};

export default PlaybackSwitcher;
