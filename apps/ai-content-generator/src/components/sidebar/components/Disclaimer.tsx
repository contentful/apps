import { FormControl, TextLink } from '@contentful/f36-components';
import { ExternalLinkTrimmedIcon } from '@contentful/f36-icons';

const Disclaimer = () => {
  return (
    <FormControl marginTop="spacingL">
      <FormControl.HelpText>
        This feature uses a third party AI tool. Please ensure your use of the tool and any
        AI-generated content complies with applicable laws, your company's policies, and all other{' '}
        <TextLink
          icon={<ExternalLinkTrimmedIcon />}
          alignIcon="end"
          href="https://openai.com/policies"
          target="_blank"
          rel="noopener noreferrer">
          Terms and Policies
        </TextLink>{' '}
      </FormControl.HelpText>
    </FormControl>
  );
};

export default Disclaimer;
