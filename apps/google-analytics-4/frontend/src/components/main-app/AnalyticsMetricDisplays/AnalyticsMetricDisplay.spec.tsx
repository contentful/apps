import AnalyticsMetricDisplay from './AnalyticsMetricDisplay';
import { render, screen } from '@testing-library/react';
import runReportResponseHasViews from '../../../../../lambda/public/sampleData/runReportResponseHasViews.json';

const PAGE_VIEWS = 3;
const METRIC_NAME = 'screenPageViews';
const SLUG = '/en-US';

const { getByText } = screen;

describe('Analytics metric display components for the analytics app', () => {
  it('can render the basic components', () => {
    render(
      <AnalyticsMetricDisplay
        handleDateRangeChange={() => {}}
        pageViews={PAGE_VIEWS}
        metricName={METRIC_NAME}
        runReportResponse={runReportResponseHasViews}
        reportSlug="/en-US"
      />
    );

    const pageViews = getByText(PAGE_VIEWS);
    const metricName = getByText('Total Views');
    const slug = getByText(`Page path: ${SLUG}`);
    const chart = document.querySelector('canvas');

    expect(pageViews).toBeVisible();
    expect(metricName).toBeVisible();
    expect(slug).toBeVisible();
    expect(chart).toBeVisible();
  });
});
