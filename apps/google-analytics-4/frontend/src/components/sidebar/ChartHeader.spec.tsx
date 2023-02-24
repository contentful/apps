import ChartHeader from './ChartHeader';
import { render, screen } from '@testing-library/react';

describe('Chart Footer for the sidebar app', () => {
  it('can render the page view number', () => {
    render(<ChartHeader metricName="pageviews" metricValue="150" />);

    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('can render the date range selector with options', () => {
    render(<ChartHeader metricName="pageviews" metricValue="150" />);

    expect(screen.getAllByRole('option').length).toBe(3);
  });
});
