import { Flex, Heading, Button, Box, Select, Subheading } from '@contentful/f36-components';
import { ArrowClockwiseIcon } from '@contentful/f36-icons';
import { MetricCard } from './MetricCard';
import { MetricsCalculator } from '../metrics/MetricsCalculator';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { AppInstallationParameters } from '../locations/ConfigScreen';
import { ErrorDisplay } from './ErrorDisplay';
import { useAllEntries } from '../hooks/useAllEntries';
import { useScheduledActions } from '../hooks/useScheduledActions';
import { useInstallationParameters } from '../hooks/useInstallationParameters';
import { ContentTrendsTabs } from './ContentTrendsTabs';
import type { TimeRange } from '../utils/trendsDataProcessor';
import React, { useState } from 'react';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ReleasesTable } from './ReleasesTable';
import { styles } from './Dashboard.styles';

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'month', label: 'Past Month' },
  { value: '3months', label: 'Past 3 Months' },
  { value: '6months', label: 'Past 6 Months' },
  { value: 'year', label: 'Past Year' },
  { value: 'yearToDate', label: 'Year to Date' },
];

const Dashboard = () => {
  const sdk = useSDK();
  const { parameters, refetchInstallationParameters } = useInstallationParameters(sdk);
  const installation = (parameters ?? {}) as AppInstallationParameters;
  const { entries, isFetchingEntries, fetchingEntriesError, refetchEntries } = useAllEntries();
  const {
    scheduledActions,
    isFetchingScheduledActions,
    fetchingScheduledActionsError,
    refetchScheduledActions,
  } = useScheduledActions();
  const [timeRange, setTimeRange] = useState<TimeRange>('year');

  const handleRefresh = async () => {
    await refetchInstallationParameters();
    refetchEntries();
    refetchScheduledActions();
  };

  const isRefreshing = isFetchingEntries || isFetchingScheduledActions;
  const hasError = fetchingEntriesError || fetchingScheduledActionsError;

  const metricsCalculator = new MetricsCalculator(entries, scheduledActions, {
    needsUpdateMonths: installation.needsUpdateMonths,
    recentlyPublishedDays: installation.recentlyPublishedDays,
    timeToPublishDays: installation.timeToPublishDays,
  });
  const metrics = metricsCalculator.getAllMetrics();

  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(e.target.value as TimeRange);
  };

  return (
    <Flex flexDirection="column" style={styles.container}>
      <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingXs">
        <Heading>Content Dashboard</Heading>
        <Button
          variant="secondary"
          size="small"
          startIcon={<ArrowClockwiseIcon />}
          onClick={handleRefresh}
          isDisabled={isRefreshing}>
          Refresh
        </Button>
      </Flex>

      {hasError ? (
        <ErrorDisplay error={fetchingEntriesError} />
      ) : isRefreshing ? (
        <LoadingSkeleton metricsCount={metricsCalculator.getAllMetrics().length} />
      ) : (
        <>
          <Box>
            <Flex flexDirection="row" gap="spacingM">
              {metrics.map((metric) => {
                return (
                  <MetricCard
                    key={metric.title}
                    title={metric.title}
                    value={metric.value}
                    subtitle={metric.subtitle}
                    isNegative={metric.isNegative}
                  />
                );
              })}
            </Flex>
          </Box>

          <Box marginTop="spacingL" style={styles.sectionContainer}>
            <Flex flexDirection="row" justifyContent="space-between" alignItems="center">
              <Subheading>Content Publishing Trends</Subheading>
              <Select value={timeRange} size="medium" onChange={handleTimeRangeChange}>
                {TIME_RANGE_OPTIONS.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Flex>
            <ContentTrendsTabs
              entries={entries}
              trackedContentTypes={installation.trackedContentTypes ?? []}
              timeRange={timeRange}
            />
          </Box>

        <Box marginTop="spacingXl">
            <Box padding="spacingL" style={styles.releasesTableContainer}>
                <Heading as="h2" marginBottom="spacingM">
                    Upcoming Scheduled Releases
                </Heading>
                <ReleasesTable />
            </Box>
        </Box>
        </>
      )}
    </Flex>
  );
};

export default Dashboard;
