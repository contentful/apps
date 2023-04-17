import ChartContent from './ChartContent';
import { render, screen } from '@testing-library/react';
import { mockSdk } from '../../../../test/mocks';
import runReportResponseHasViews from '../../../../../lambda/public/sampleData/runReportResponseHasViews.json';
import runReportResponseNoView from '../../../../../lambda/public/sampleData/runReportResponseNoViews.json';
import { EMPTY_DATA_MSG } from '../constants/noteMessages';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

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

    expect(screen.getByText('api error')).toBeVisible();
  });

  it('mounts with warning message if empty data', () => {
    render(<ChartContent pageViewData={runReportResponseNoView} />);

    expect(screen.getByText(EMPTY_DATA_MSG)).toBeVisible();
  });
});
