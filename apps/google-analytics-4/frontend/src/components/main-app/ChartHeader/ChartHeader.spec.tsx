import ChartHeader from './ChartHeader';
import { render, screen } from '@testing-library/react';

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

  it('renders custom range summary and action when custom range is selected', () => {
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

    expect(screen.getByText('2026-4-3 to 2026-4-10')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Choose dates' })).toBeVisible();
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
