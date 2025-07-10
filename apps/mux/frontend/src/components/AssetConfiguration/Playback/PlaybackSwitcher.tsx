import React from 'react';
import { Flex } from '@contentful/f36-components';
import { MuxContentfulObject } from '../../../util/types';
import { PlaybackPolicySelector } from '../PlaybackPolicySelector';
import { PolicyType } from '../../../util/types';

interface PlaybackSwitcherProps {
  value: MuxContentfulObject;
  onSwapPlaybackIDs: (policy: PolicyType) => void;
  enableSignedUrls: boolean;
}

function isUsingSigned(value: MuxContentfulObject): boolean {
  return !!(value && value.signedPlaybackId && !value.playbackId);
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
  return isUsingSigned(value) ? 'signed' : 'public';
}

export const PlaybackSwitcher: React.FC<PlaybackSwitcherProps> = ({
  value,
  onSwapPlaybackIDs,
  enableSignedUrls,
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
      />
    </Flex>
  );
};

export default PlaybackSwitcher;
