import AnalyticsApp from './AnalyticsApp';
import { render, screen } from '@testing-library/react';
import runReportResponseHasViews from '../../../../../lambda/public/sampleData/runReportResponseHasViews.json';
import runReportResponseNoView from '../../../../../lambda/public/sampleData/runReportResponseNoViews.json';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useAutoResizer: () => jest.fn(),
  useFieldValue: () => 'fieldValue',
}));

const { findByTestId, getByTestId, getByText } = screen;

describe('AnalyticsApp', () => {
  it('mounts data', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(
        jest.fn(() =>
          Promise.resolve({ ok: true, json: () => Promise.resolve(runReportResponseHasViews) })
        ) as jest.Mock
      );

    render(<AnalyticsApp />);

    const dropdown = await findByTestId('cf-ui-select');
    const chart = document.querySelector('canvas');

    expect(dropdown).toBeVisible();
    expect(chart).toBeVisible();
  });

  it('mounts with warning message when no data', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(
        jest.fn(() =>
          Promise.resolve({ ok: true, json: () => Promise.resolve(runReportResponseNoView) })
        ) as jest.Mock
      );

    render(<AnalyticsApp />);

    const dropdown = await findByTestId('cf-ui-select');
    const warningNote = getByTestId('cf-ui-note');
    const noteText = getByText('There are no pageviews to show for this range');

    expect(dropdown).toBeVisible();
    expect(warningNote).toBeVisible();
    expect(noteText).toBeVisible();
  });
});
