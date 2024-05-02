import { HelpText, TextLink } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';

export const DraftModeHelpText = () => (
  <HelpText>
    Select the route from your application that enables Draft Mode. See our{' '}
    <TextLink
      icon={<ExternalLinkIcon />}
      alignIcon="end"
      href="http://www.example.com"
      target="_blank"
      rel="noopener noreferrer">
      Vercel developer guide
    </TextLink>{' '}
    for instructions on setting up a Draft Mode route handler. UPDATE LINK
  </HelpText>
);
