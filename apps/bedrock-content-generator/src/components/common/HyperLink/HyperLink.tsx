import { MouseEventHandler } from 'react';
import { TextLink, TextLinkProps } from '@contentful/f36-components';
import { SerializedStyles } from '@emotion/react';

interface Props {
  body: string;
  substring: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  hyperLinkHref?: string;
  icon?: JSX.Element;
  alignIcon?: TextLinkProps['alignIcon'];
  textLinkStyle?: SerializedStyles;
}

const HyperLink = (props: Props) => {
  const {
    body,
    substring,
    onClick = () => {},
    hyperLinkHref,
    icon,
    alignIcon,
    textLinkStyle,
  } = props;
  const textLinkComponent = (index: number) => (
    <TextLink
      onClick={onClick}
      href={hyperLinkHref}
      target="_blank"
      rel="noopener noreferer"
      key={`textLink-${index}`}
      icon={icon}
      alignIcon={alignIcon}
      css={textLinkStyle}>
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

export default HyperLink;
