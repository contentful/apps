import { FC, ReactNode } from 'react';
import { TextLink } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';

/**
 * A link that leaves Contentful.
 *
 * `rel="noopener noreferrer"` is the reason this exists rather than being inlined each time: the
 * app runs in an iframe, and a `target="_blank"` without it hands the opened page a handle on the
 * opener.
 */
const ExternalLink: FC<{ href: string; children: ReactNode }> = ({ href, children }) => (
  <TextLink
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    icon={<ExternalLinkIcon />}
    alignIcon="end">
    {children}
  </TextLink>
);

export default ExternalLink;
