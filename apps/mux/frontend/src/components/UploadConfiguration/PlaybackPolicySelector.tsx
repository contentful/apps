import { FC, useEffect } from 'react';
import { FormControl, Checkbox, TextLink } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';

interface PlaybackPolicySelectorProps {
  selectedPolicies: string[];
  onPoliciesChange: (policies: string[]) => void;
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
    const value = event.target.value;
    const newPolicies = event.target.checked
      ? [...selectedPolicies, value]
      : selectedPolicies.filter((p) => p !== value);
    onPoliciesChange(newPolicies);
  };

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(selectedPolicies.length > 0);
    }
  }, [selectedPolicies]);

  return (
    <FormControl>
      <Checkbox.Group
        name="checkbox-playback-policies"
        value={selectedPolicies}
        onChange={handlePolicyChange}>
        <FormControl marginBottom="none">
          <Checkbox value="signed" isDisabled={!enableSignedUrls}>
            Protected
          </Checkbox>
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
          <Checkbox value="public">Public</Checkbox>
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
      </Checkbox.Group>
      {selectedPolicies.length === 0 && (
        <FormControl.ValidationMessage>
          Please select at least one privacy option
        </FormControl.ValidationMessage>
      )}
    </FormControl>
  );
};
