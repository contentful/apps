import React, { useState } from 'react';
import { Box, Button, Flex, Note } from '@contentful/f36-components';
import { MuxContentfulObject, PolicyType } from '../../../util/types';
import { PlaybackPolicySelector } from '../PlaybackPolicySelector';
import { existingPlaybackPolicy, pendingPlaybackPolicy } from '../../../util/playbackPolicy';

interface PlaybackSwitcherProps {
  value: MuxContentfulObject;
  onSwapPlaybackIDs: (policy: PolicyType) => void;
  enableSignedUrls: boolean;
  enableDRM?: boolean;
}

export const PlaybackSwitcher: React.FC<PlaybackSwitcherProps> = ({
  value,
  onSwapPlaybackIDs,
  enableSignedUrls,
  enableDRM = false,
}) => {
  const isAudioOnly = value?.audioOnly ?? false;
  const existingPolicy = existingPlaybackPolicy(value);
  const pendingPolicy = pendingPlaybackPolicy(value);

  // Only read while there is nothing to switch between, so it never competes with the switcher's
  // own selection. `public` is the starting point because it is the one policy no installation
  // setting can take away — signed and DRM are the configurable ones, and the selector disables
  // whichever of them this install cannot create.
  const [requestedPolicy, setRequestedPolicy] = useState<PolicyType>('public');

  // No playback ID of any policy: there is nothing to swap, so the tab offers a create instead.
  // Reached by a `moderate` run with `on_flagged.action: delete_playback_ids`, or by a delete in
  // the Mux dashboard — and until now the only way out of it was the Mux dashboard, because the
  // switcher reported the asset as already public and dropped the click.
  if (!existingPolicy) {
    if (pendingPolicy) {
      return (
        <Box marginTop="spacingM">
          <Note variant="primary" data-testid="playback-create-pending">
            A <strong>{pendingPolicy}</strong> playback ID will be created when you publish this
            entry, the same way a policy change is. Nothing has been created at Mux yet.
          </Note>
        </Box>
      );
    }

    return (
      <Box marginTop="spacingM">
        <Note variant="warning" data-testid="playback-create-offer">
          This video has no playback ID, so it cannot be played or embedded. Request one here and
          it is created when you publish the entry.
        </Note>
        <Box marginTop="spacingM">
          {/* The same selector the switcher uses, so an installation that cannot sign or use DRM
              is offered exactly what it can create — a policy we know will fail is not a choice. */}
          <PlaybackPolicySelector
            selectedPolicies={[requestedPolicy]}
            onPoliciesChange={(policies) => setRequestedPolicy(policies[0])}
            enableSignedUrls={enableSignedUrls}
            enableDRM={enableDRM}
            isAudioOnly={isAudioOnly}
          />
          <Button
            variant="primary"
            data-testid="playback-create-request"
            onClick={() => onSwapPlaybackIDs(requestedPolicy)}>
            Request playback ID
          </Button>
        </Box>
      </Box>
    );
  }

  // What `currentPlaybackPolicy` computes, spelled out because `existingPolicy` is known to be
  // defined past the branch above — so this needs no fallback and no cast.
  const selectedPolicy = pendingPolicy ?? existingPolicy;

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
        isAudioOnly={isAudioOnly}
      />
    </Flex>
  );
};

export default PlaybackSwitcher;
