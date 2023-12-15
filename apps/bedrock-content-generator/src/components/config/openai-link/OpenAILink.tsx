import { ExternalLinkIcon } from '@contentful/f36-icons';
import { TextLink } from '@contentful/f36-components';

interface Props {
  body: string;
  substring: string;
}

// TODO: We should use the HyperLink component from the integration-component-library
const OpenAILink = (props: Props) => {
  const { body, substring } = props;

  const textLinkComponent = (index: number) => (
    <TextLink
      href={'https://openai.com'}
      target="_blank"
      rel="noopener noreferer"
      key={`textLink-${index}`}
      icon={<ExternalLinkIcon />}
      alignIcon={'end'}>
      {substring}
    </TextLink>
  );

  const formatLink = () => {
    const bodyWithTextLink = body.split(substring).reduce((prev: unknown, current, i) => {
      if (!i) {
        return [current];
      }
      if (Array.isArray(prev)) {
        return prev.concat(textLinkComponent(i), current);
      }
    }, []);
    return bodyWithTextLink as JSX.Element;
  };

  return formatLink();
};

export default OpenAILink;
