import ChartContent from './ChartContent';
import { render, screen } from '@testing-library/react';
import runReportResponseHasViews from '../../../../../lambda/public/sampleData/runReportResponseHasViews.json';
import runReportResponseNoView from '../../../../../lambda/public/sampleData/runReportResponseNoViews.json';
import { EMPTY_DATA_MSG } from '../constants/noteMessages';

const { getByText } = screen;

describe('ChartContent component', () => {
  it('mounts', () => {
    render(<ChartContent pageViewData={runReportResponseHasViews} />);

    const chart = document.querySelector('canvas');

    expect(chart).toBeVisible();
    expect(chart).toHaveAccessibleName('Analytics line chart');
  });

  it('mounts with error message if error', () => {
    render(
      <ChartContent pageViewData={runReportResponseHasViews} error={new Error('api error')} />
    );

    const noteText = getByText('api error');

    expect(noteText).toBeVisible();
  });

  it('mounts with warning message if empty data', () => {
    render(<ChartContent pageViewData={runReportResponseNoView} />);

    const noteText = getByText(EMPTY_DATA_MSG);

    expect(noteText).toBeVisible();
  });
});
