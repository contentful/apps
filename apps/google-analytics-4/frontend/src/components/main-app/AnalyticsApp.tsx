import { useAutoResizer, useFieldValue } from '@contentful/react-apps-toolkit';
import ChartFooter from 'components/main-app/ChartFooter';
import ChartHeader from 'components/main-app/ChartHeader';
import { useEffect, useState } from 'react';
import { DateRangeType, RunReportResponse } from 'types';
import { config } from '../../config';
import ChartContent from './ChartContent';

const AnalyticsApp = () => {
  const [runReportResponse, setRunReportResponse] = useState<RunReportResponse>({} as RunReportResponse);
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
      {runReportResponse.rowCount ? <ChartContent pageViewData={runReportResponse} dateRange={dateRange} /> : null}
      <ChartFooter slugName={slugValue ? slugValue : ''} viewUrl="https://analytics.google.com/" />
    </>
  );
};

export default AnalyticsApp;
