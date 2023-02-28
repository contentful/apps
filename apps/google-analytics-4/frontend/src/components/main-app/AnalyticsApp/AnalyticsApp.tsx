import { useAutoResizer, useFieldValue } from '@contentful/react-apps-toolkit';
import ChartFooter from 'components/main-app/ChartFooter/ChartFooter';
import ChartHeader from 'components/main-app/ChartHeader/ChartHeader';
import { useEffect, useState } from 'react';
import { RunReportResponse } from 'types';
import { config } from '../../../config';
import LineChart from '../LineChart/LineChart';

const AnalyticsApp = () => {
  const [runReportResponse, setRunReportResponse] = useState<RunReportResponse | undefined>();
  const [slugValue] = useFieldValue<string>('slug');

  useAutoResizer();

  useEffect(() => {
    const baseUrl = config.backendApiUrl;

    async function fetchData() {
      const response = await fetch(`${baseUrl}/sampleData/runReportResponseHasViews.json`);
      setRunReportResponse(await response.json());
    }

    fetchData();
  }, []);

  const pageViews =
    runReportResponse &&
    runReportResponse.rows.reduce((acc, val) => {
      const metric = +val.metricValues[0].value;
      return acc + metric;
    }, 0);

  const metricName = runReportResponse && runReportResponse.metricHeaders[0].name;

  const mockData = [1000, -500, 500, 230];
  const mockLabels = ['January', 'February', 'March', 'April'];

  return (
    <>
      <ChartHeader
        metricName={metricName ? metricName : ''}
        metricValue={pageViews || pageViews === 0 ? pageViews.toString() : ''}
      />
      <ChartFooter slugName={slugValue ? slugValue : ''} viewUrl="https://analytics.google.com/" />
      <LineChart dataValues={mockData} xAxisLabels={mockLabels} tooltipMetricLabel="Page views" />
    </>
  );
};

export default AnalyticsApp;
