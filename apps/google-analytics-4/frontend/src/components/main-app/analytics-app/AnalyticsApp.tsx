import { useAutoResizer, useFieldValue } from '@contentful/react-apps-toolkit';
import ChartFooter from 'components/main-app/ChartFooter';
import ChartHeader from 'components/main-app/ChartHeader';
import { useEffect, useState } from 'react';
import { useApi } from 'hooks/useApi';
import getRangeDates from 'helpers/handle-date-range/handle-date-range';
import ChartContent from '../ChartContent';
import { DateRangeType, ServiceAccountKeyId, ServiceAccountKey } from 'types';
import { styles } from './AnalyticsApp.styles';
import { Flex, Note } from '@contentful/f36-components';
import { RunReportData } from '@/apis/apiTypes';

const DEFAULT_ERR_MSG = 'Oops! Cannot display the analytics data at this time.';
const EMPTY_DATA_MSG = 'There are no page views to show for this range';

interface Props {
  serviceAccountKeyId?: ServiceAccountKeyId;
  serviceAccountKey?: ServiceAccountKey;
  propertyId: string;
  reportSlug: string;
}
const AnalyticsApp = (props: Props) => {
  const { serviceAccountKeyId, serviceAccountKey, propertyId, reportSlug } = props;
  const [runReportResponse, setRunReportResponse] = useState<RunReportData>({} as RunReportData);
  const [dateRange, setDateRange] = useState<DateRangeType>('lastWeek');
  const [startEndDates, setStartEndDates] = useState<any>(getRangeDates('lastWeek')); // TYPE
  const [slugValue] = useFieldValue<string>('slug');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error>();

  const api = useApi(serviceAccountKeyId, serviceAccountKey);

  useAutoResizer();

  const reportRequestParams = {
    startDate: startEndDates.start,
    endDate: startEndDates.end,
    propertyId,
    dimensions: ['date'],
    metrics: ['screenPageViews'],
    slug: reportSlug,
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const reportData = await api.runReports(reportRequestParams);
        setRunReportResponse(reportData);
      } catch (e) {
        setError(e as Error);
      }

      setLoading(false);
    }

    fetchData();
  }, [api, reportRequestParams.startDate, reportRequestParams.endDate, reportSlug]);

  useEffect(() => {
    if (runReportResponse.rowCount) {
      setStartEndDates(getRangeDates(dateRange));
      setRunReportResponse(runReportResponse);
      setLoading(false);
    }
  }, [dateRange, runReportResponse]);

  useEffect(() => {
    setStartEndDates(getRangeDates(dateRange));
  }, [dateRange]);

  const handleDateRangeChange = (e: DateRangeType) => {
    setDateRange(e);
  };

  const pageViews =
    runReportResponse.rows &&
    runReportResponse.rows.reduce((acc, val) => {
      const metric = +val.metricValues[0].value;
      return acc + metric;
    }, 0);

  const metricName = runReportResponse.metricHeaders && runReportResponse.metricHeaders[0].name;

  const renderChartContent = () => {
    if (error) {
      return <Note variant="negative">{error?.message || DEFAULT_ERR_MSG}</Note>;
    } else if (!runReportResponse.rowCount) {
      return <Note variant="warning">{EMPTY_DATA_MSG}</Note>;
    }

    return <ChartContent pageViewData={runReportResponse} />;
  };

  return (
    <>
      {loading ? (
        <Flex justifyContent="center" alignItems="center" className={styles.wrapper}>
          <div className={styles.loader}></div>
        </Flex>
      ) : (
        <>
          <ChartHeader
            metricName={metricName ? metricName : ''}
            metricValue={pageViews || pageViews === 0 ? pageViews.toString() : ''}
            handleChange={handleDateRangeChange}
          />
          {renderChartContent()}

          <ChartFooter
            slugName={slugValue ? slugValue : ''}
            viewUrl="https://analytics.google.com/"
          />
        </>
      )}
    </>
  );
};

export default AnalyticsApp;
