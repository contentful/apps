import { Box, Flex, Grid, IconButton, Subheading, Text } from '@contentful/f36-components';
import { CycleIcon, PresentationIcon } from '@contentful/f36-icons';
import {
  WebhookCallDetailsProps,
  WebhookCallRequest,
} from 'contentful-management/dist/typings/entities/webhook';
import { useEffect } from 'react';
import AppActionCard from '../components/AppActionCard';
import EmptyFishbowl from '../components/EmptyFishbowl';
import useGetAppActions from '../hooks/useGetAppActions';

export interface ActionResultData extends WebhookCallDetailsProps {
  request: WebhookCallRequest & { function?: string };
}
export interface ActionResultType {
  success: boolean;
  data?: ActionResultData;
  error?: unknown;
  timestamp: string;
  actionId: string;
}

const Page = () => {
  const { getAllAppActions, appActions, loading } = useGetAppActions();

  useEffect(() => {
    getAllAppActions();
  }, [getAllAppActions]);

  return (
    <Box
      style={{
        minHeight: '97vh',
        padding: '20px',
        margin: '20px',
        marginTop: '0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        borderRadius: '8px',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
      }}>
      <Box
        style={{
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
        }}>
        <Flex>
          <PresentationIcon style={{ marginRight: '8px' }} size="xlarge" />
          <Text as="h1" fontSize="fontSizeXl">
            <strong>App Actions</strong> <i>Demo Console</i>
            <Subheading>
              An example app for testing{' '}
              <a href="https://www.contentful.com/developers/docs/extensibility/app-framework/app-actions/">
                Contentful App Actions
              </a>
            </Subheading>
          </Text>
          <IconButton
            style={{ marginLeft: 'auto' }}
            variant="secondary"
            aria-label="Reload App Actions"
            icon={<CycleIcon />}
            onClick={() => getAllAppActions()}
          />
        </Flex>
      </Box>

      {!loading && appActions?.items?.length ? (
        <Box
          style={{
            margin: '0 auto',
            flex: 1,
            minWidth: '100%',
          }}>
          <Grid style={{ width: '100%' }} columns="1fr" rowGap="spacingM">
            {appActions.items.map((action) => (
              <AppActionCard action={action} />
            ))}
          </Grid>
        </Box>
      ) : (
        <Flex
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
          style={{ flex: 1 }}>
          <EmptyFishbowl />
          <Text style={{ textAlign: 'center', marginTop: '20px' }}>
            Uh oh, there's nothing here. It's time to create an App Action!
            <br />
            Navigate to your app's definition in the Contentful Web App and create a new App Action.
          </Text>
        </Flex>
      )}
    </Box>
  );
};

export default Page;
