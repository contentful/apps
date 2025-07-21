import { FC, useEffect } from 'react';
import { FormControl, Radio, TextLink } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { PolicyType } from '../../util/types';

interface PlaybackPolicySelectorProps {
  selectedPolicies: PolicyType[];
  onPoliciesChange: (policies: PolicyType[]) => void;
  enableSignedUrls: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

const playbackPolicyLink =
  'https://www.mux.com/docs/guides/secure-video-playback#understanding-playback-policies';

export const PlaybackPolicySelector: FC<PlaybackPolicySelectorProps> = ({
  selectedPolicies,
  onPoliciesChange,
  enableSignedUrls,
  onValidationChange,
}) => {
  const handlePolicyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as PolicyType;
    onPoliciesChange([value]);
  };

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(selectedPolicies.length > 0);
    }
  }, [selectedPolicies]);

  return (
    <FormControl>
      <Radio.Group
        name="radio-playback-policies"
        value={selectedPolicies[0] ?? ''}
        onChange={handlePolicyChange}>
        <FormControl marginBottom="none">
          <Radio value="signed" isDisabled={!enableSignedUrls}>
            Protected
          </Radio>
          <FormControl.HelpText>
            Require a valid JSON Web Token (JWT) to gain access.
            <TextLink
              icon={<ExternalLinkIcon />}
              variant="secondary"
              href={playbackPolicyLink}
              target="_blank"
              rel="noopener noreferrer"
            />
          </FormControl.HelpText>
        </FormControl>

        <FormControl marginBottom="none">
          <Radio value="public">Public</Radio>
          <FormControl.HelpText>
            Can be watched anywhere, at any time, without any restrictions.
            <TextLink
              icon={<ExternalLinkIcon />}
              variant="secondary"
              href={playbackPolicyLink}
              target="_blank"
              rel="noopener noreferrer"
            />
          </FormControl.HelpText>
        </FormControl>
      </Radio.Group>
      {selectedPolicies.length === 0 && (
        <FormControl.ValidationMessage>
          Please select at least one privacy option
        </FormControl.ValidationMessage>
      )}
    </FormControl>
  );
};
