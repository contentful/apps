import { useAutoResizer, useFieldValue } from '@contentful/react-apps-toolkit';
import ChartFooter from 'components/sidebar/ChartFooter';
import ChartHeader from 'components/sidebar/ChartHeader';
import { useEffect, useState } from 'react';
import { RunReportResponse } from 'types';
import { config } from '../../config';

export default function SidebarAnalytics() {
  const [runReportResponse, setRunReportResponse] = useState<RunReportResponse | undefined>();
  const [slugValue] = useFieldValue<string | undefined>('slug');

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
      const metric = Number(val.metricValues[0].value);
      return acc + metric;
    }, 0);

  const metricName = runReportResponse && runReportResponse.metricHeaders[0].name;

  return (
    <>
      <ChartHeader
        metricName={metricName !== undefined ? metricName : ''}
        metricValue={pageViews !== undefined ? pageViews.toString() : ''}
      />
      <ChartFooter
        slugName={slugValue !== undefined ? slugValue : ''}
        viewUrl="https://analytics.google.com/"
      />
    </>
  );
}
