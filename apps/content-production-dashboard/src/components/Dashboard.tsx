import { Button, Flex, Heading } from '@contentful/f36-components';
import { ArrowClockwiseIcon } from '@contentful/f36-icons';
import { MetricCard } from './MetricCard';
import { MetricsCalculator } from '../metrics/MetricsCalculator';
import { ScheduledActionStatus, EntryProps, ScheduledActionProps } from 'contentful-management';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { AppInstallationParameters } from '../locations/ConfigScreen';
import { styles } from '../locations/Page.styles';

const Dashboard = () => {
  const sdk = useSDK();
  const installation = (sdk.parameters.installation ?? {}) as AppInstallationParameters;

  // TODO (fetching ticket): replace this with the real fetched entries.
  // Mocked entries for UI testing (created/published dates are relative to "now").
  const now = new Date();
  const daysAgo = (days: number) =>
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  const daysFromNow = (days: number) =>
    new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  const entries: EntryProps[] = [
    // Published in last 30 days, 5 days to publish
    {
      sys: {
        createdAt: daysAgo(10),
        publishedAt: daysAgo(5),
        updatedAt: daysAgo(5),
      },
    } as unknown as EntryProps,
    // Published in last 30 days, 2 days to publish
    {
      sys: {
        createdAt: daysAgo(20),
        publishedAt: daysAgo(18),
      },
    } as unknown as EntryProps,
    // Published in previous 30-day window (helps MoM comparison)
    {
      sys: {
        createdAt: daysAgo(50),
        publishedAt: daysAgo(40),
        // Older than 6 months → should count in "Needs Update"
        updatedAt: daysAgo(220),
      },
    } as unknown as EntryProps,
  ];

  // TODO (fetching ticket): replace this with cma.scheduledActions.getMany(...)
  const scheduledActions: ScheduledActionProps[] = [
    // Within next 30 days
    {
      entity: {
        sys: { type: 'Link', linkType: 'Entry', id: 'entry-1' },
      },
      environment: {
        sys: { type: 'Link', linkType: 'Environment', id: 'test-environment' },
      },
      scheduledFor: { datetime: daysFromNow(3), timezone: 'UTC' },
      action: 'publish',
      sys: {
        id: 'scheduled-action-1',
        type: 'ScheduledAction',
        status: ScheduledActionStatus.scheduled,
        createdAt: daysAgo(1),
        createdBy: { sys: { type: 'Link', linkType: 'User', id: 'user-1' } },
        space: { sys: { type: 'Link', linkType: 'Space', id: 'test-space' } },
        updatedAt: daysAgo(1),
        updatedBy: { sys: { type: 'Link', linkType: 'User', id: 'user-1' } },
        version: 1,
      },
    },
    {
      entity: {
        sys: { type: 'Link', linkType: 'Entry', id: 'entry-2' },
      },
      environment: {
        sys: { type: 'Link', linkType: 'Environment', id: 'test-environment' },
      },
      scheduledFor: { datetime: daysFromNow(15), timezone: 'UTC' },
      action: 'publish',
      sys: {
        id: 'scheduled-action-2',
        type: 'ScheduledAction',
        status: ScheduledActionStatus.scheduled,
        createdAt: daysAgo(2),
        createdBy: { sys: { type: 'Link', linkType: 'User', id: 'user-1' } },
        space: { sys: { type: 'Link', linkType: 'Space', id: 'test-space' } },
        updatedAt: daysAgo(2),
        updatedBy: { sys: { type: 'Link', linkType: 'User', id: 'user-1' } },
        version: 1,
      },
    },
    // Outside next 30 days (should not count)
    {
      entity: {
        sys: { type: 'Link', linkType: 'Entry', id: 'entry-3' },
      },
      environment: {
        sys: { type: 'Link', linkType: 'Environment', id: 'test-environment' },
      },
      scheduledFor: { datetime: daysFromNow(45), timezone: 'UTC' },
      action: 'publish',
      sys: {
        id: 'scheduled-action-3',
        type: 'ScheduledAction',
        status: ScheduledActionStatus.scheduled,
        createdAt: daysAgo(3),
        createdBy: { sys: { type: 'Link', linkType: 'User', id: 'user-1' } },
        space: { sys: { type: 'Link', linkType: 'Space', id: 'test-space' } },
        updatedAt: daysAgo(3),
        updatedBy: { sys: { type: 'Link', linkType: 'User', id: 'user-1' } },
        version: 1,
      },
    },
  ];

  const metrics = new MetricsCalculator(entries, scheduledActions, {
    needsUpdateMonths: installation.needsUpdateMonths,
    recentlyPublishedDays: installation.recentlyPublishedDays,
    timeToPublishDays: installation.timeToPublishDays,
  }).metrics;

  return (
    <Flex flexDirection="column" style={styles.container}>
      {/* Header */}
      <Flex flexDirection="row" justifyContent="space-between" marginBottom="spacingL">
        <Heading>Content Dashboard</Heading>
        <Button
          variant="secondary"
          startIcon={<ArrowClockwiseIcon />}
          onClick={() => {
            // Refresh functionality to be implemented later
          }}>
          Refresh
        </Button>
      </Flex>

      {/* Metrics Cards */}
      <Flex flexDirection="row" gap="spacingM">
        {metrics.map((metric) => {
          return (
            <MetricCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              subtitle={metric.subtitle}
              icon={metric.icon}
              isNegative={metric.isNegative}
            />
          );
        })}
      </Flex>
    </Flex>
  );
};

export default Dashboard;
