import { HyperLink } from '@contentful/integration-component-library';
import { ExternalLinkIcon } from '@contentful/f36-icons';

export const BODY_MSG =
  "This feature uses a third party AI tool. Please ensure your use of the tool and any AI-generated content complies with applicable laws, your company's policies, and all other Terms and Policies";

const DisclaimerMessage = () => {
  return (
    <HyperLink
      body={BODY_MSG}
      substring="Terms and Policies"
      hyperLinkHref="https://openai.com/policies"
      icon={<ExternalLinkIcon />}
      alignIcon="end"
    />
  );
};

export default DisclaimerMessage;
