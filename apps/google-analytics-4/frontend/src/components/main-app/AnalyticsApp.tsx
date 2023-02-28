import { useAutoResizer, useFieldValue } from '@contentful/react-apps-toolkit';
import ChartFooter from 'components/main-app/ChartFooter';
import ChartHeader from 'components/main-app/ChartHeader';
import { useEffect, useState } from 'react';
import { DateRangeType, Row, RunReportResponse } from 'types';
import { config } from '../../config';
import ChartContent from './ChartContent';

const AnalyticsApp = () => {
  const [runReportResponse, setRunReportResponse] = useState<RunReportResponse>({} as RunReportResponse);
  const [pageViewData, setPageViewData] = useState<RunReportResponse>(runReportResponse)
  const [slugValue] = useFieldValue<string>('slug');
  const [dateRange, setDateRange] = useState<DateRangeType>('lastWeek')
  useAutoResizer();

  useEffect(() => {
    const baseUrl = config.backendApiUrl;

    async function fetchData() {
      const response = await fetch(`${baseUrl}/sampleData/runReportResponseHasViews.json`);
      if (response.ok) setRunReportResponse(await response.json());
    }

    fetchData();
  }, []);

  useEffect(() => sliceByDateRange(dateRange), [dateRange, runReportResponse])

  const handleDateRangeChange = (e: DateRangeType) => {
    setDateRange(e);
    sliceByDateRange(e)
  }

  const sliceByDateRange = (dateRange: DateRangeType) => {
    if (runReportResponse.rowCount) {
      let newRows: Row[] = [];
      switch (dateRange) {
        case 'lastDay':
          newRows = runReportResponse.rows.slice(0, 2);
          break;
        case 'lastWeek':
          newRows = runReportResponse.rows.slice(0, 7);
          break;
        case 'lastMonth':
          newRows = runReportResponse.rows.slice(0, 28);
          break;
      }
      setPageViewData({ ...runReportResponse, rows: [...newRows] });
    }
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
      {pageViewData.rowCount ? <ChartContent pageViewData={pageViewData} dateRange={dateRange} /> : null}
      <ChartFooter slugName={slugValue ? slugValue : ''} viewUrl="https://analytics.google.com/" />
    </>
  );
};

export default AnalyticsApp;
