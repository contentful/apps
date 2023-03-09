import AnalyticsApp from './AnalyticsApp';
import { render, screen } from '@testing-library/react';
import { mockSdk, mockCma } from '../../../../test/mocks';
import runReportResponseHasViews from '../../../../../lambda/public/sampleData/runReportResponseHasViews.json';
import runReportResponseNoView from '../../../../../lambda/public/sampleData/runReportResponseNoViews.json';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useAutoResizer: () => jest.fn(),
  useFieldValue: () => 'fieldValue',
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

const mockApi = jest.fn();
jest.mock('hooks/useApi', () => ({
  useApi: () => ({
    runReports: mockApi,
  }),
}));

const { findByTestId, getByTestId, getByText, findByText } = screen;

const SELECT_TEST_ID = 'cf-ui-select';
const NOTE_TEST_ID = 'cf-ui-note';

describe('AnalyticsApp', () => {
  it('mounts data', async () => {
    mockApi.mockImplementation(() => runReportResponseHasViews);

    render(<AnalyticsApp propertyId="" reportSlug="" />);

    const dropdown = await findByTestId(SELECT_TEST_ID);
    const chart = document.querySelector('canvas');

    expect(dropdown).toBeVisible();
    expect(chart).toBeVisible();
  });

  it('mounts with warning message when no data', async () => {
    mockApi.mockImplementation(() => runReportResponseNoView);

    render(<AnalyticsApp propertyId="" reportSlug="" />);

    const dropdown = await findByTestId(SELECT_TEST_ID);
    const warningNote = getByTestId(NOTE_TEST_ID);
    const noteText = getByText('There are no page views to show for this range');

    expect(dropdown).toBeVisible();
    expect(warningNote).toBeVisible();
    expect(noteText).toBeVisible();
  });

  it('mounts with error message when fetch error thrown', async () => {
    mockApi.mockRejectedValue(() => new Error('mock Api error'));

    render(<AnalyticsApp propertyId="" reportSlug="" />);

    const dropdown = await findByTestId(SELECT_TEST_ID);
    const errorNote = getByTestId(NOTE_TEST_ID);

    const noteText = await findByText('mock Api error');

    expect(dropdown).toBeVisible();
    expect(errorNote).toBeVisible();
    expect(noteText).toBeVisible();
  });
});
