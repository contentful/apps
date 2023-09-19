import { useAutoResizer } from '@contentful/react-apps-toolkit';
import { useEffect, useState, useMemo } from 'react';
import { Api } from 'apis/api';
import getRangeDates from 'helpers/DateRangeHelpers/DateRangeHelpers';
import { DateRangeType, StartEndDates, ContentTypeValue } from 'types';
import { Skeleton } from '@contentful/f36-components';
import { isEmpty } from 'lodash';
import { RunReportData } from 'apis/apiTypes';
import { useSidebarSlug } from 'hooks/useSidebarSlug/useSidebarSlug';
import SlugWarningDisplay from 'components/main-app/SlugWarningDisplay/SlugWarningDisplay';
import AnalyticsMetricDisplay from 'components/main-app/AnalyticsMetricDisplays/AnalyticsMetricDisplay';

interface Props {
  api: Api;
  propertyId: string;
  slugFieldInfo: ContentTypeValue;
}
const AnalyticsApp = (props: Props) => {
  const { api, propertyId, slugFieldInfo } = props;

  const [runReportResponse, setRunReportResponse] = useState<RunReportData>({} as RunReportData);
  const [dateRange, setDateRange] = useState<DateRangeType>('lastWeek');
  const [startEndDates, setStartEndDates] = useState<StartEndDates>(getRangeDates('lastWeek'));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error>();

  const { reportSlug, isContentTypeWarning } = useSidebarSlug(slugFieldInfo);

  useAutoResizer();

  const reportRequestParams = useMemo(
    () => ({
      startDate: startEndDates.start,
      endDate: startEndDates.end,
      propertyId,
      dimensions: ['date'],
      metrics: ['screenPageViews'],
      slug: reportSlug,
    }),
    [startEndDates.start, startEndDates.end, reportSlug, propertyId]
  );

  const runReportFetchRequirements = reportSlug && propertyId && !isContentTypeWarning;

  useEffect(() => {
    async function fetchRunReportData() {
      try {
        const reportData = await api.runReports(reportRequestParams);
        setRunReportResponse(reportData);
        setError(undefined);
      } catch (e) {
        setError(e as Error);
      }
    }

    if (runReportFetchRequirements) fetchRunReportData();

    setLoading(false);
  }, [api, reportRequestParams, runReportFetchRequirements]);

  useEffect(() => {
    if (runReportResponse.rowCount) {
      setRunReportResponse(runReportResponse);
    }
  }, [dateRange, runReportResponse]);

  const handleDateRangeChange = (e: DateRangeType) => {
    setDateRange(e);
    setStartEndDates(getRangeDates(e));
  };

  const pageViews =
    runReportResponse.rows &&
    runReportResponse.rows.reduce((acc, val) => {
      const metric = +val.metricValues[0].value;
      return acc + metric;
    }, 0);

  const metricName = runReportResponse.metricHeaders && runReportResponse.metricHeaders[0].name;

  const pendingData = isEmpty(runReportResponse) && !error && runReportFetchRequirements;

  const renderAnalyticContent = () => {
    if (loading || pendingData) {
      return (
        <Skeleton.Container svgHeight={300}>
          <Skeleton.Image height={68} width={325} offsetTop={10} />
          <Skeleton.Image height={160} width={325} offsetTop={93} />
          <Skeleton.Image height={25} width={200} offsetTop={268} />
        </Skeleton.Container>
      );
    }

    if (isContentTypeWarning) {
      return <SlugWarningDisplay slugFieldInfo={slugFieldInfo} />;
    }

    return (
      <AnalyticsMetricDisplay
        handleDateRangeChange={handleDateRangeChange}
        runReportResponse={runReportResponse}
        metricName={metricName}
        reportSlug={reportSlug}
        pageViews={pageViews}
        error={error}
        propertyId={propertyId}
        startEndDates={startEndDates}
        selectedDateRange={dateRange}
      />
    );
  };

  return renderAnalyticContent();
};

export default AnalyticsApp;
