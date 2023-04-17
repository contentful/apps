import AnalyticsMetricDisplay from './AnalyticsMetricDisplay';
import { render, screen } from '@testing-library/react';
import runReportResponseHasViews from '../../../../../lambda/public/sampleData/runReportResponseHasViews.json';

const PAGE_VIEWS = 0;
const METRIC_NAME = 'screenPageViews';
const SLUG = '/en-US';

describe('Analytics metric display components for the analytics app', () => {
  it('can render the basic components', () => {
    render(
      <AnalyticsMetricDisplay
        handleDateRangeChange={() => {}}
        pageViews={PAGE_VIEWS}
        metricName={METRIC_NAME}
        runReportResponse={runReportResponseHasViews}
        reportSlug="/en-US"
        propertyId=""
        startEndDates={{ start: '2023-03-26', end: '2023-03-27' }}
      />
    );

    expect(screen.getByText(PAGE_VIEWS)).toBeVisible();
    expect(screen.getByText('Total Views')).toBeVisible();
    expect(screen.getByText(`Page path: ${SLUG}`)).toBeVisible();
    expect(document.querySelector('canvas')).toBeVisible();
  });
});
