import { useAutoResizer } from '@contentful/react-apps-toolkit';
import ChartFooter from 'components/main-app/ChartFooter';
import ChartHeader from 'components/main-app/ChartHeader';
import { useEffect, useState, useMemo } from 'react';
import { Api } from 'apis/api';
import getRangeDates from 'helpers/DateRangeHelpers/DateRangeHelpers';
import ChartContent from '../ChartContent';
import { DateRangeType, ContentTypeValue } from 'types';
import { styles } from './AnalyticsApp.styles';
import { Flex, Note } from '@contentful/f36-components';
import { RunReportData } from 'apis/apiTypes';
import useGetFieldValue from 'hooks/useGetFieldValue';
import { pathJoin } from '../../../utils/pathJoin';

const DEFAULT_ERR_MSG = 'Oops! Cannot display the analytics data at this time.';
const EMPTY_DATA_MSG = 'There are no page views to show for this range';

interface Props {
  api: Api;
  propertyId: string;
  slugFieldInfo: ContentTypeValue;
}
const AnalyticsApp = (props: Props) => {
  const { api, propertyId, slugFieldInfo } = props;
  const { slugField, urlPrefix } = slugFieldInfo;
  const [runReportResponse, setRunReportResponse] = useState<RunReportData>({} as RunReportData);
  const [dateRange, setDateRange] = useState<DateRangeType>('lastWeek');
  const [startEndDates, setStartEndDates] = useState<any>(getRangeDates('lastWeek')); // TYPE
  const [slugValue, setSlugValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error>();

  const slugFieldValue = useGetFieldValue(slugField);

  useAutoResizer();

  const reportSlug = `/${pathJoin(urlPrefix || '', slugValue || '')}`;

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

  useEffect(() => {
    setSlugValue(slugFieldValue);
  }, [slugFieldValue]);

  useEffect(() => {
    async function fetchRunReportData() {
      try {
        const reportData = await api.runReports(reportRequestParams);
        setRunReportResponse(reportData);
      } catch (e) {
        setError(e as Error);
      }

      setLoading(false);
    }

    fetchRunReportData();
  }, [api, reportRequestParams]);

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

  const renderChartContent = () => {
    if (error) {
      return (
        <Note className={styles.note} variant="negative">
          <p className={styles.noteContent}>{error.message || DEFAULT_ERR_MSG}</p>
        </Note>
      );
    } else if (!runReportResponse.rowCount) {
      return (
        <Note className={styles.note} variant="warning">
          <p className={styles.noteContent}>{EMPTY_DATA_MSG}</p>
        </Note>
      );
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

          <ChartFooter slugName={reportSlug} viewUrl="https://analytics.google.com/" />
        </>
      )}
    </>
  );
};

export default AnalyticsApp;
