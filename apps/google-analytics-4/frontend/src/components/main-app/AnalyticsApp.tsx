import { useAutoResizer, useFieldValue } from '@contentful/react-apps-toolkit';
import ChartFooter from 'components/main-app/ChartFooter';
import ChartHeader from 'components/main-app/ChartHeader';
import { useEffect, useState } from 'react';
import { DateRangeType, Row, RunReportResponse } from 'types';
import DateRange from '@/helpers/dateRange.enum';
import { config } from '../../config';
import ChartContent from './ChartContent';

const AnalyticsApp = () => {
  const [runReportResponse, setRunReportResponse] = useState<RunReportResponse>({} as RunReportResponse);
  const [pageViewData, setPageViewData] = useState<RunReportResponse>(runReportResponse);
  const [dateRange, setDateRange] = useState<DateRangeType>('lastWeek')
  const [slugValue] = useFieldValue<string>('slug');
  useAutoResizer();

  useEffect(() => {
    const baseUrl = config.backendApiUrl;

    async function fetchData() {
      const response = await fetch(`${baseUrl}/sampleData/runReportResponseHasViews.json`);
      if (response.ok) {
        setRunReportResponse(await response.json());
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    const sliceByDateRange = (dateRange: DateRangeType): RunReportResponse => {
      let newRows: Row[] = [];
      switch (dateRange) {
        case DateRange.LastDay:
          newRows = runReportResponse.rows.slice(0, 2);
          break;
        case DateRange.LastWeek:
          newRows = runReportResponse.rows.slice(0, 7);
          break;
        case DateRange.LastMonth:
          newRows = runReportResponse.rows.slice(0, 28);
          break;
      }
      return { ...runReportResponse, rows: [...newRows] };

    }
    if (runReportResponse.rowCount) {
      const newData = sliceByDateRange(dateRange);
      setPageViewData(newData)
    }
  }, [dateRange, runReportResponse])


  const handleDateRangeChange = (e: DateRangeType) => {
    setDateRange(e);
  }

  const pageViews =
    runReportResponse.rows &&
    runReportResponse.rows.reduce((acc, val) => {
      const metric = +val.metricValues[0].value;
      return acc + metric;
    }, 0);

  const metricName = runReportResponse.metricHeaders && runReportResponse.metricHeaders[0].name;

  return (
    <>
      <ChartHeader
        metricName={metricName ? metricName : ''}
        metricValue={pageViews || pageViews === 0 ? pageViews.toString() : ''}
        handleChange={handleDateRangeChange}
      />
      {pageViewData.rowCount ? <ChartContent pageViewData={pageViewData} /> : <>There are no pageviews to show for this range</>}
      <ChartFooter slugName={slugValue ? slugValue : ''} viewUrl="https://analytics.google.com/" />
    </>
  );
};

export default AnalyticsApp;
