import ChartHeader from './ChartHeader';
import { render, screen } from '@testing-library/react';

const mockMetricName = 'pageviews';
const mockMetricValue = '150';
const handleChange = () => {};

describe('Chart Header for the analytics app', () => {
  it('can render the metric value', () => {
    render(
      <ChartHeader
        metricName={mockMetricName}
        metricValue={mockMetricValue}
        handleChange={handleChange}
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
      />
    );

    expect(screen.getAllByRole('option').length).toBe(3);
  });
});
