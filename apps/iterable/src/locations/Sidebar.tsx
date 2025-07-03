import { CopyButton, Flex, Paragraph, TextInput, TextLink, Text } from '@contentful/f36-components';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();

  const link = `https://cdn.contentful.com/spaces/${sdk.ids.space}/environments/master/entries?access_token=${sdk.parameters.installation.contentfulApiKey}&sys.id=${sdk.ids.entry}&include=2`;

  return (
    <Flex flexDirection="column">
      <Text fontWeight="fontWeightDemiBold" marginBottom="spacingXs">
        Data feed link
      </Text>
      <TextInput.Group>
        <TextInput isDisabled isReadOnly value={link} />
        <CopyButton value={link} tooltipProps={{ placement: 'right', usePortal: true }} />
      </TextInput.Group>
      <Paragraph marginTop="spacingXs" fontColor={'gray500'}>
        Copy and paste this link into your Iterable data feed. Content automatically syncs when the
        entry is published.{' '}
        <TextLink
          href=""
          target="_blank"
          rel="noopener noreferrer"
          alignIcon="end"
          icon={<ExternalLinkIcon />}>
          Learn more
        </TextLink>
      </Paragraph>
    </Flex>
  );
};

export default Sidebar;
