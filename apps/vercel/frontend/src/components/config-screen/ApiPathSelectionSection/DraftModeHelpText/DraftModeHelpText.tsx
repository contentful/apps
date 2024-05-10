import { HelpText, TextLink } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { copies } from '@constants/copies';

export const DraftModeHelpText = () => {
  const helpTextHref = copies.configPage.pathSelectionSection.helpText.href;

  return (
    <HelpText>
      Select the route from your application that enables Draft Mode. See our{' '}
      <TextLink
        icon={<ExternalLinkIcon />}
        alignIcon="end"
        href={helpTextHref}
        target="_blank"
        rel="noopener noreferrer">
        Vercel developer guide
      </TextLink>{' '}
      for instructions on setting up a Draft Mode route handler.
    </HelpText>
  );
};
