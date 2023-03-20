import React from 'react';
import ChartFooter from 'components/main-app/ChartFooter/ChartFooter';
import ChartHeader from 'components/main-app/ChartHeader/ChartHeader';
import ChartContent from '../ChartContent/ChartContent';
import { RunReportResponse } from 'types';

interface Props {
  handleDateRangeChange: Function;
  runReportResponse: RunReportResponse;
  reportSlug: string;
  pageViews: number;
  metricName: string;
  error?: Error;
}

const AnalyticsMetricDisplay = (props: Props) => {
  const { handleDateRangeChange, runReportResponse, reportSlug, error, metricName, pageViews } =
    props;
  return (
    <>
      <ChartHeader
        metricName={metricName ? metricName : ''}
        metricValue={pageViews || pageViews === 0 ? pageViews.toString() : ''}
        handleChange={handleDateRangeChange}
      />

      <ChartContent error={error} pageViewData={runReportResponse} />

      <ChartFooter
        slugName={`Page path: ${reportSlug}` || ''}
        viewUrl="https://analytics.google.com/"
      />
    </>
  );
};

export default AnalyticsMetricDisplay;
