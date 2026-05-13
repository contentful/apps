import ChartHeader from './ChartHeader';
import { render, screen, within } from '@testing-library/react';

const mockMetricName = 'pageviews';
const mockMetricValue = '150';
const handleChange = () => {};
const handleMetricChange = () => {};
const handleCustomRangeRequest = () => {};
const startEndDates = { start: '2026-4-3', end: '2026-4-10' };

describe('Chart Header for the analytics app', () => {
  it('can render the metric value', () => {
    render(
      <ChartHeader
        metricName={mockMetricName}
        metricValue={mockMetricValue}
        handleChange={handleChange}
        handleMetricChange={handleMetricChange}
        handleCustomRangeRequest={handleCustomRangeRequest}
        startEndDates={startEndDates}
      />
    );

    expect(screen.getByText('150')).toBeVisible();
  });

  it('can render the date range selector with options', () => {
    render(
      <ChartHeader
        metricName={mockMetricName}
        metricValue={mockMetricValue}
        handleChange={handleChange}
        handleMetricChange={handleMetricChange}
        handleCustomRangeRequest={handleCustomRangeRequest}
        startEndDates={startEndDates}
      />
    );

    expect(screen.getAllByRole('option').length).toBe(8);
    expect(screen.getByRole('option', { name: 'Total views' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Unique views' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Last 90 days' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Last 12 months' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Custom range' })).toBeVisible();
  });


  it('renders a locale selector when locale options are provided', () => {
    render(
      <ChartHeader
        metricName={mockMetricName}
        metricValue={mockMetricValue}
        handleChange={handleChange}
        handleMetricChange={handleMetricChange}
        handleCustomRangeRequest={handleCustomRangeRequest}
        startEndDates={startEndDates}
        selectedLocale="en-US"
        handleLocaleChange={() => {}}
        localeOptions={[
          { code: 'en-US', label: 'English (en-US)' },
          { code: 'fr-FR', label: 'French (fr-FR)' },
        ]}
      />
    );

    const localeSelect = screen.getByRole('combobox', { name: 'Locale' });

    expect(localeSelect).toHaveValue('en-US');
    expect(within(localeSelect).getByRole('option', { name: 'English (en-US)' })).toBeVisible();
    expect(within(localeSelect).getByRole('option', { name: 'French (fr-FR)' })).toBeVisible();
  });

  it('renders the custom range action without displaying the selected dates', () => {
    render(
      <ChartHeader
        metricName={mockMetricName}
        metricValue={mockMetricValue}
        handleChange={handleChange}
        handleMetricChange={handleMetricChange}
        handleCustomRangeRequest={handleCustomRangeRequest}
        startEndDates={startEndDates}
        selectedDateRange="custom"
      />
    );

    expect(screen.getByRole('button', { name: 'Choose dates' })).toBeVisible();
    expect(screen.queryByText('2026-4-3 to 2026-4-10')).toBeNull();
  });

  it('renders unique views label when active users metric is selected', () => {
    render(
      <ChartHeader
        metricName="activeUsers"
        metricValue={mockMetricValue}
        handleChange={handleChange}
        handleMetricChange={handleMetricChange}
        handleCustomRangeRequest={handleCustomRangeRequest}
        startEndDates={startEndDates}
        selectedMetric="activeUsers"
      />
    );

    expect(screen.getByText('Unique Views')).toBeVisible();
  });
});
