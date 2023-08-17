import { ExternalLinkIcon } from '@contentful/f36-icons';
import { TextLink } from '@contentful/f36-components';

interface Props {
  body: string;
  substring: string;
  href: string
}

// TODO: We should use the HyperLink component from the integration-component-library
const Hyperlink = (props: Props) => {
  const { body, substring, href } = props;

  const textLinkComponent = (index: number) => (
    <TextLink
      href={href}
      target="_blank"
      rel="noopener noreferer"
      key={`textLink-${index}`}
      icon={<ExternalLinkIcon />}
      alignIcon={'end'}>
      {substring}
    </TextLink>
  );

  const formatLink = () => {
    // eslint-disable-next-line array-callback-return
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

export default Hyperlink;
