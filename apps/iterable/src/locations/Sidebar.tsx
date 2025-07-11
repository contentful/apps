import {
  CopyButton,
  Flex,
  Paragraph,
  TextInput,
  TextLink,
  Text,
  IconButton,
  Skeleton,
} from '@contentful/f36-components';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { WarningOctagonIcon } from '@phosphor-icons/react';
import tokens from '@contentful/f36-tokens';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();

  const space = sdk.ids.space;
  const apiKey = sdk.parameters.installation.contentfulApiKey;
  const entryId = sdk.ids.entry;
  const localization = sdk.locales.available.length > 1 ? `&locale=*` : '';

  const hasError = !space || !apiKey || !entryId;

  const link = hasError
    ? ''
    : `https://cdn.contentful.com/spaces/${space}/environments/master/entries/${sdk.ids.entry}?access_token=${apiKey}${localization}`;

  return (
    <Flex flexDirection="column">
      <Text fontWeight="fontWeightDemiBold" marginBottom="spacingXs">
        Data feed link
      </Text>
      <TextInput.Group>
        <TextInput isDisabled isReadOnly value={link} isInvalid={hasError} />
        <CopyButton
          value={link}
          variant={hasError ? 'negative' : 'secondary'}
          isDisabled={hasError}
          tooltipProps={{ placement: 'right', usePortal: true }}
        />
      </TextInput.Group>
      <Paragraph marginTop="spacingXs" fontColor="gray500">
        Copy and paste this link into your Iterable data feed. Content automatically syncs when the
        entry is published. {/* TODO: Add link to documentation */}
        <TextLink
          target="_blank"
          rel="noopener noreferrer"
          alignIcon="end"
          icon={<ExternalLinkIcon />}>
          Learn more
        </TextLink>
      </Paragraph>
      {hasError && (
        <Flex alignItems="center" gap="spacing2Xs">
          <WarningOctagonIcon size={16} color={tokens.red600} />
          <Text fontColor="red600">Link generation error</Text>
        </Flex>
      )}
    </Flex>
  );
};

export default Sidebar;
