import AnalyticsApp from './AnalyticsApp';
import { act, render, screen } from '@testing-library/react';
import { mockSdk, mockCma, validServiceKeyFile, validServiceKeyId } from '../../../../test/mocks';
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

const renderAnalyticsApp = async () =>
  await act(async () => {
    render(
      <AnalyticsApp
        serviceAccountKeyId={validServiceKeyId}
        serviceAccountKey={validServiceKeyFile}
        propertyId=""
        reportSlug=""
      />
    );
  });

describe('AnalyticsApp', () => {
  beforeEach(() => {
    mockSdk.app.getParameters.mockReturnValue({
      serviceAccountKey: validServiceKeyFile,
      serviceAccountKeyId: validServiceKeyId,
    });
  });

  it('mounts data', async () => {
    mockApi.mockImplementation(() => runReportResponseHasViews);
    renderAnalyticsApp();

    const dropdown = await findByTestId(SELECT_TEST_ID);
    const chart = document.querySelector('canvas');

    expect(dropdown).toBeVisible();
    expect(chart).toBeVisible();
  });

  it('mounts with warning message when no data', async () => {
    mockApi.mockImplementation(() => runReportResponseNoView);
    renderAnalyticsApp();

    const dropdown = await findByTestId(SELECT_TEST_ID);
    const warningNote = getByTestId(NOTE_TEST_ID);
    const noteText = getByText('There are no page views to show for this range');

    expect(dropdown).toBeVisible();
    expect(warningNote).toBeVisible();
    expect(noteText).toBeVisible();
  });

  it('renders nothing when it has no response', async () => {
    renderAnalyticsApp();

    expect(screen.queryByTestId(SELECT_TEST_ID)).toBeNull();
    expect(screen.queryByTestId(NOTE_TEST_ID)).toBeNull();
    expect(screen.queryByTestId('mock Api error')).toBeNull();
  });
});
