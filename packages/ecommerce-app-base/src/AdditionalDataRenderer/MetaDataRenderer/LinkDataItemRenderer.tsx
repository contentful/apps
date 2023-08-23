import type { FC } from 'react';
import { Caption, TextLink } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';

type Props = {
  text: string;
  href: string;
};

export const LinkDataItemRenderer: FC<Props> = ({ text, href }) => {
  return (
    <Caption>
      <TextLink
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: tokens.fontSizeS }}
        icon={<ExternalLinkIcon size={'tiny'} />}
        alignIcon="end">
        {text}
      </TextLink>
    </Caption>
  );
};
