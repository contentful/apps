import {
  Box,
  Button,
  Flex,
  Heading,
  Paragraph,
  Skeleton,
  Subheading,
  Text,
  TextLink,
} from '@contentful/f36-components';
import { CycleIcon, ExternalLinkIcon } from '@contentful/f36-icons';
import { useEffect } from 'react';
import AppActionCard from '../components/AppActionCard';
import EmptyFishbowl from '../components/EmptyFishbowl';
import useGetAppActions from '../hooks/useGetAppActions';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';
import { AppActionCallProps, AppActionCallRawResponseProps } from 'contentful-management';
export interface ActionResultType {
  success: boolean;
  call?: AppActionCallProps;
  response?: AppActionCallRawResponseProps;
  error?: unknown;
  timestamp: string;
  actionId: string;
  callId?: string;
}

const Page = () => {
  const { getAllAppActions, appActions, loading, error } = useGetAppActions();

  useEffect(() => {
    getAllAppActions();
  }, [getAllAppActions]);

  const sdk = useSDK<PageAppSDK>();

  const hostname = sdk.hostnames.webapp;
  const orgId = sdk.ids.organization;
  const appId = sdk.ids.app;
  const appActionsUrl = `https://${hostname}/account/organizations/${orgId}/apps/definitions/${appId}/actions`;

  const renderAppActionList = () => {
    if (loading) {
      return (
        <Skeleton.Container>
          <Skeleton.BodyText numberOfLines={4} />
        </Skeleton.Container>
      );
    } else if (error) {
      return (
        <Flex
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
          style={{ flex: 1 }}>
          <Text style={{ textAlign: 'center' }}>
            Uh oh, there was an error loading the app actions. Please try again.
          </Text>
        </Flex>
      );
    } else if (appActions?.items?.length) {
      return appActions.items.map((action) => (
        <AppActionCard action={action} key={action.sys.id} />
      ));
    }

    return (
      <Flex justifyContent="center" alignItems="center" flexDirection="column" style={{ flex: 1 }}>
        <EmptyFishbowl />
        <Text style={{ textAlign: 'center', marginTop: '20px' }}>
          Uh oh, there's nothing here. It's time to create an App Action!
          <br />
          Navigate to your app's definition in the Contentful Web App and create a new App Action.
        </Text>
        <TextLink
          href={appActionsUrl}
          target="_blank"
          rel="noopener noreferer"
          icon={<ExternalLinkIcon />}
          alignIcon="end">
          Go to app definition
        </TextLink>
      </Flex>
    );
  };

  return (
    <Box
      style={{
        height: 'auto',
        margin: `${tokens.spacingXl} auto`,
        padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`,
        maxWidth: '900px',
        backgroundColor: tokens.colorWhite,
        borderRadius: '6px',
        border: `1px solid ${tokens.gray300}`,
        zIndex: 2,
      }}>
      <Box>
        <Heading>App Actions Demo Console</Heading>
        <Paragraph>
          An example app for testing{' '}
          <a href="https://www.contentful.com/developers/docs/extensibility/app-framework/app-actions/">
            {' '}
            Contentful App Actions
          </a>{' '}
        </Paragraph>
      </Box>

      <Box
        style={{
          height: 'auto',
          margin: `${tokens.spacingXl} auto`,
          padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`,
          maxWidth: '900px',
          backgroundColor: tokens.colorWhite,
          borderRadius: '6px',
          border: `1px solid ${tokens.gray300}`,
          zIndex: 2,
        }}>
        <Box marginBottom="spacingL">
          <Subheading as="h2">App Actions</Subheading>
          <Paragraph>
            All app actions associated with this app definition are listed below. Add values for
            parameters and click Call Action to test the action. The request and response will then
            appear for you to inspect. To view any changes made to the app actions, click Refresh
            App Actions.
          </Paragraph>
          <Button
            variant="secondary"
            aria-label="Reload App Actions"
            startIcon={<CycleIcon />}
            onClick={() => getAllAppActions()}>
            Refresh App Actions
          </Button>
        </Box>
        {renderAppActionList()}
      </Box>
    </Box>
  );
};

export default Page;
