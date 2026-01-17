import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  Flex,
  Grid,
  GridItem,
  Heading,
  Paragraph,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
} from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import ProgressBar from '../components/ProgressBar';

type UsageMetricsSuccess = {
  status: string;
  character_count: number;
  character_limit: number;
  tier: string;
  next_character_count_reset_unix: number;
};

type UsageMetricsFailure = {
  status: 'error';
  code: 'PROVIDER_ERROR';
};

type UsageMetricsResult = UsageMetricsSuccess | UsageMetricsFailure;

type AppActionResult =
  | { ok: true; data: UsageMetricsResult }
  | { ok: false; errors?: Array<{ message: string }> };

const ACTION_NAME = 'Get Usage Metrics';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const [metrics, setMetrics] = useState<UsageMetricsResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('current');

  const resolveActionId = async (): Promise<string | null> => {
    const appDefinitionId = sdk.ids.app;
    if (!appDefinitionId) {
      return null;
    }

    const actions = await sdk.cma.appAction.getMany({ appDefinitionId });
    const matchedAction = actions.items.find((action) => action.name === ACTION_NAME);
    return matchedAction?.sys.id ?? null;
  };

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const appActionId = await resolveActionId();
        if (!appActionId) {
          setErrorMessage('Usage metrics action not found.');
          return;
        }

        const appActionCall = await sdk.cma.appActionCall.createWithResult(
          {
            appDefinitionId: sdk.ids.app || '',
            appActionId,
          },
          {
            parameters: {},
          }
        );

        const result = appActionCall.sys.result as AppActionResult | undefined;
        if (!result || !result.ok) {
          setErrorMessage('Unable to load usage metrics.');
          return;
        }

        setMetrics(result.data);
      } catch (error) {
        setErrorMessage('Unable to load usage metrics.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [sdk]);

  const usagePercent = useMemo(() => {
    if (!metrics || metrics.status === 'error') {
      return 0;
    }

    if (!metrics.character_limit) {
      return 0;
    }

    return Math.min(100, Math.round((metrics.character_count / metrics.character_limit) * 100));
  }, [metrics]);

  const usageVariant = useMemo(() => {
    if (usagePercent > 90) {
      return 'negative' as const;
    }
    if (usagePercent > 75) {
      return 'warning' as const;
    }
    return 'positive' as const;
  }, [usagePercent]);

  const resetDate = useMemo(() => {
    if (!metrics || metrics.status === 'error') {
      return 'Unavailable';
    }

    return new Date(metrics.next_character_count_reset_unix * 1000).toLocaleString();
  }, [metrics]);

  if (isLoading) {
    return (
      <Box padding="spacingXl">
        <Skeleton.Container>
          <Skeleton.BodyText numberOfLines={6} />
        </Skeleton.Container>
      </Box>
    );
  }

  return (
    <Box padding="spacingXl">
      <Flex flexDirection="column" gap="spacingL">
        <Flex alignItems="center" justifyContent="space-between">
          <Heading>Broadcast Usage Dashboard</Heading>
          <Select
            id="usageViewMode"
            name="usageViewMode"
            value={viewMode}
            onChange={(event) => setViewMode(event.target.value)}
            aria-label="Usage view">
            <Select.Option value="current">Current billing cycle</Select.Option>
          </Select>
        </Flex>

        {errorMessage ? (
          <Card>
            <Text>{errorMessage}</Text>
          </Card>
        ) : metrics?.status === 'error' ? (
          <Card>
            <Flex flexDirection="column" gap="spacingS">
              <Text>Unable to load ElevenLabs usage data. Please verify your API key.</Text>
              <Text>
                If you use restricted keys, enable ElevenLabs permissions: Administration &gt; User
                &gt; Read.
              </Text>
            </Flex>
          </Card>
        ) : metrics ? (
          <>
            <Card>
              <Flex flexDirection="column" gap="spacingM">
                <Paragraph>Monthly character usage</Paragraph>
                <ProgressBar value={usagePercent} variant={usageVariant} />
                <Text>
                  {metrics.character_count.toLocaleString()} /{' '}
                  {metrics.character_limit.toLocaleString()} characters ({usagePercent}%)
                </Text>
              </Flex>
            </Card>

            <Grid columns="repeat(3, 1fr)" columnGap="spacingM" rowGap="spacingM">
              <GridItem>
                <Card>
                  <Paragraph>Tier</Paragraph>
                  <Heading>{metrics.tier}</Heading>
                </Card>
              </GridItem>
              <GridItem>
                <Card>
                  <Paragraph>Status</Paragraph>
                  <Heading>{metrics.status}</Heading>
                </Card>
              </GridItem>
              <GridItem>
                <Card>
                  <Paragraph>Next reset</Paragraph>
                  <Heading>{resetDate}</Heading>
                </Card>
              </GridItem>
            </Grid>

            <Card>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    <TableCell>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Characters used</TableCell>
                    <TableCell>{metrics.character_count.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Character limit</TableCell>
                    <TableCell>{metrics.character_limit.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Usage percentage</TableCell>
                    <TableCell>{usagePercent}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </>
        ) : (
          <Card>
            <Text>No usage data available.</Text>
          </Card>
        )}
      </Flex>
    </Box>
  );
};

export default Page;
