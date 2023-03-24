import React, { MouseEventHandler } from 'react';
import { TextLink } from '@contentful/f36-components';

interface Props {
  body: string;
  substring: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  hyperLinkHref?: string;
}

const HyperLink = (props: Props) => {
  const { body, substring, onClick = () => {}, hyperLinkHref } = props;
  const link = (
    <TextLink onClick={onClick} href={hyperLinkHref} target="_blank" rel="noopener noreferer">
      {substring}
    </TextLink>
  );

  const formatLink = () => {
    const bodyWithTextLink = body.split(substring).reduce((prev: any, current, i) => {
      if (!i) {
        return [current];
      }
      return prev.concat(link, current);
    }, []);
    return bodyWithTextLink;
  };

  return formatLink();
};

export default HyperLink;
