import { useAutoResizer } from '@contentful/react-apps-toolkit';
import { useEffect, useState } from 'react';
import { Api } from 'apis/api';
import getRangeDates from 'helpers/DateRangeHelpers/DateRangeHelpers';
import {
  AnalyticsMetricType,
  DateRangeType,
  StartEndDates,
  ContentTypeRule,
  RunReportResponse,
  CustomRangeDialogResult,
} from 'types';
import { Skeleton } from '@contentful/f36-components';
import { isEmpty } from 'lodash';
import { RunReportData } from 'apis/apiTypes';
import { useSidebarRules } from 'hooks/useSidebarRules/useSidebarRules';
import SlugWarningDisplay from 'components/main-app/SlugWarningDisplay/SlugWarningDisplay';
import AnalyticsMetricDisplay from 'components/main-app/AnalyticsMetricDisplays/AnalyticsMetricDisplay';

interface Props {
  api: Api;
  propertyId: string;
  slugFieldRules: ContentTypeRule[];
  openCustomRangeDialog: (
    startEndDates: StartEndDates
  ) => Promise<CustomRangeDialogResult | undefined>;
}

const mergeRunReportResponses = (responses: RunReportData[]): RunReportData => {
  const baseResponse = responses[0];
  const rowMap = new Map<string, number>();

  responses.forEach((response) => {
    response.rows.forEach((row) => {
      const dateKey = row.dimensionValues[0].value;
      const metricValue = Number(row.metricValues[0].value || 0);
      rowMap.set(dateKey, (rowMap.get(dateKey) || 0) + metricValue);
    });
  });

  const rows = Array.from(rowMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([dateKey, value]) => ({
      dimensionValues: [{ value: dateKey, oneValue: 'value' }],
      metricValues: [{ value: String(value), oneValue: 'value' }],
    }));

  return {
    ...baseResponse,
    rows,
    rowCount: rows.length,
  } as RunReportResponse;
};

const AnalyticsApp = (props: Props) => {
  const { api, propertyId, slugFieldRules, openCustomRangeDialog } = props;

  const [runReportResponse, setRunReportResponse] = useState<RunReportData>({} as RunReportData);
  const [dateRange, setDateRange] = useState<DateRangeType>('lastWeek');
  const [selectedMetric, setSelectedMetric] = useState<AnalyticsMetricType>('screenPageViews');
  const [startEndDates, setStartEndDates] = useState<StartEndDates>(getRangeDates('lastWeek'));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error>();

  const {
    validRules,
    summaryLabel,
    isContentTypeWarning,
    warningRule,
    haveLoadedFieldValues,
    haveLoadedPublicationState,
  } = useSidebarRules(slugFieldRules);

  useAutoResizer();

  const runReportFetchRequirements =
    haveLoadedFieldValues && validRules.length > 0 && propertyId && !isContentTypeWarning;

  useEffect(() => {
    async function fetchRunReportData() {
      setLoading(true);
      setError(undefined);

      try {
        const reportData = await Promise.all(
          validRules.map((rule) =>
            api.runReports({
              startDate: startEndDates.start,
              endDate: startEndDates.end,
              propertyId,
              dimensions: ['date'],
              metrics: [selectedMetric],
              slug: rule.reportSlug,
              matchDimension: rule.enableAdvancedMatching ? rule.matchDimension : undefined,
              matchType: rule.enableAdvancedMatching ? rule.matchType : undefined,
            })
          )
        );

        setRunReportResponse(mergeRunReportResponses(reportData));
        setError(undefined);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    }

    if (runReportFetchRequirements) {
      fetchRunReportData();
    } else {
      setError(undefined);
      setLoading(false);
    }
  }, [
    api,
    propertyId,
    runReportFetchRequirements,
    selectedMetric,
    startEndDates.end,
    startEndDates.start,
    validRules,
  ]);

  const handleDateRangeChange = async (e: DateRangeType) => {
    if (e === 'custom') {
      const customRange = await openCustomRangeDialog(startEndDates);
      if (customRange) {
        setDateRange('custom');
        setStartEndDates(customRange);
      }
      return;
    }

    setDateRange(e);
    setStartEndDates(getRangeDates(e));
  };

  const handleMetricChange = (metric: AnalyticsMetricType) => {
    setSelectedMetric(metric);
  };

  const pageViews =
    runReportResponse.rows &&
    runReportResponse.rows.reduce((acc, val) => {
      const metric = +val.metricValues[0].value;
      return acc + metric;
    }, 0);

  const metricName = runReportResponse.metricHeaders && runReportResponse.metricHeaders[0].name;

  const pendingData = isEmpty(runReportResponse) && !error && runReportFetchRequirements;
  const showInitialLoadingSkeleton =
    (loading && pendingData) || !haveLoadedFieldValues || !haveLoadedPublicationState;

  const renderAnalyticContent = () => {
    if (showInitialLoadingSkeleton) {
      return (
        <Skeleton.Container svgHeight={300}>
          <Skeleton.Image height={68} width={325} offsetTop={10} />
          <Skeleton.Image height={160} width={325} offsetTop={93} />
          <Skeleton.Image height={25} width={200} offsetTop={268} />
        </Skeleton.Container>
      );
    }

    if (isContentTypeWarning && haveLoadedFieldValues) {
      return <SlugWarningDisplay slugFieldInfo={warningRule || { slugField: '', urlPrefix: '' }} />;
    }

    return (
      <AnalyticsMetricDisplay
        handleDateRangeChange={handleDateRangeChange}
        handleMetricChange={handleMetricChange}
        handleCustomRangeRequest={() => handleDateRangeChange('custom')}
        runReportResponse={runReportResponse}
        metricName={metricName}
        reportSlug={summaryLabel}
        includedPaths={validRules.map((rule) => rule.reportSlug)}
        canOpenInGoogleAnalytics={validRules.length === 1}
        pageViews={pageViews}
        error={error}
        propertyId={propertyId}
        startEndDates={startEndDates}
        selectedDateRange={dateRange}
        selectedMetric={selectedMetric}
        isLoading={loading && !pendingData}
      />
    );
  };

  return renderAnalyticContent();
};

export default AnalyticsApp;
