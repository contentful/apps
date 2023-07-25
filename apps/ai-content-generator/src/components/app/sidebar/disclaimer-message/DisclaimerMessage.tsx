// import { HyperLink } from '@contentful/integration-component-library';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { TextLink } from '@contentful/f36-components';

export const BODY_MSG =
  "This feature uses a third party AI tool. Please ensure your use of the tool and any AI-generated content complies with applicable laws, your company's policies, and all other Terms and Policies";

// TODO: We are just pasting in HyperLink from the integration-component-library
// because currently fails to run in build mode. Possibly to do with tree shaking.
// We should remove this and use the HyperLink component from the integration-component-library
const DisclaimerMessage = () => {
  const body = BODY_MSG;
  const substring = 'Terms and Policies';
  const textLinkComponent = (index: number) => (
    <TextLink
      // onClick={onClick}
      href={'https://openai.com/policies'}
      target="_blank"
      rel="noopener noreferer"
      key={`textLink-${index}`}
      icon={<ExternalLinkIcon />}
      alignIcon={'end'}>
      {substring}
    </TextLink>
  );

  const formatLink = () => {
    const bodyWithTextLink = body.split(substring).reduce((prev: any, current, i) => {
      if (!i) {
        return [current];
      }
      return prev.concat(textLinkComponent(i), current);
    }, []);
    return bodyWithTextLink as JSX.Element;
  };

  return formatLink();
};

export default DisclaimerMessage;
