import { PageAppSDK } from '@contentful/app-sdk';
import { Button, Flex, Heading, Box } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { GearSixIcon } from '@contentful/f36-icons';
import { styles } from './Page.styles';
import { RedirectsTable } from '../components/RedirectsTable';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();

  return (
    <Flex flexDirection="column" style={styles.container}>
      <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingXs">
        <Heading>Redirects manager</Heading>
        <Button
          variant="secondary"
          startIcon={<GearSixIcon />}
          onClick={() => {
            sdk.navigator.openAppConfig();
          }}
          isDisabled={false}>
          App configuration
        </Button>
      </Flex>

      <Box padding="spacingL" marginTop="spacingXl">
        <RedirectsTable />
      </Box>
    </Flex>
  );
};

export default Page;
