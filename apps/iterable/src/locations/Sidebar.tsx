import { CopyButton, Flex, Paragraph, TextInput, TextLink, Text } from '@contentful/f36-components';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { CopyIcon, ExternalLinkIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  const value = 'a link';
  return (
    <Flex flexDirection="column">
      <Text fontWeight="fontWeightDemiBold" marginBottom="spacingXs">
        Data feed link
      </Text>
      <TextInput.Group>
        <TextInput isDisabled isReadOnly value={value} />
        <CopyButton value={value} tooltipProps={{ placement: 'right', usePortal: true }} />
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
