import AnalyticsApp from './AnalyticsApp';
import { render, screen } from '@testing-library/react';
import { Api } from 'apis/api';
import { mockSdk, mockCma, validServiceKeyId } from '../../../../test/mocks';
import runReportResponseHasViews from '../../../../../lambda/public/sampleData/runReportResponseHasViews.json';
import runReportResponseNoView from '../../../../../lambda/public/sampleData/runReportResponseNoViews.json';
import {
  EMPTY_DATA_MSG,
  getContentTypeSpecificMsg,
} from 'components/main-app/constants/noteMessages';
import * as useSidebarRules from 'hooks/useSidebarRules/useSidebarRules';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useAutoResizer: () => vi.fn(),
  useFieldValue: () => ['fieldValue'],
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

const mockApi = vi.fn();

const { findByTestId, getByTestId, getByText, queryByTestId } = screen;

const SELECT_TEST_ID = 'cf-ui-select';
const NOTE_TEST_ID = 'cf-ui-note';

const renderAnalyticsApp = async () =>
  render(
    <AnalyticsApp
      api={{ runReports: mockApi } as unknown as Api}
      propertyId="properties/12345"
      slugFieldRules={[{ id: 'rule-title', contentTypeId: 'category', slugField: 'title', urlPrefix: '' } as any]}
      openCustomRangeDialog={vi.fn()}
    />
  );

describe('AnalyticsApp with correct content types configured', () => {
  beforeEach(() => {
    mockSdk.app.getParameters.mockReturnValue({
      serviceAccountKeyId: validServiceKeyId,
    });

    vi.spyOn(useSidebarRules, 'useSidebarRules').mockImplementation(() => ({
      validRules: [
        {
          id: 'rule-title',
          contentTypeId: 'category',
          slugField: 'title',
          urlPrefix: '',
          reportSlug: 'report slug',
          enableAdvancedMatching: false,
        },
      ],
      summaryLabel: 'report slug',
      isContentTypeWarning: false,
      warningRule: undefined,
    }));
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
    const noteText = getByText(EMPTY_DATA_MSG);

    expect(dropdown).toBeVisible();
    expect(warningNote).toBeVisible();
    expect(noteText).toBeVisible();
  });

  it('mounts with error message when error thrown', async () => {
    mockApi.mockRejectedValue(() => new Error('api error'));
    renderAnalyticsApp();

    const dropdown = await findByTestId(SELECT_TEST_ID);
    const warningNote = getByTestId(NOTE_TEST_ID);
    const noteText = getByText('api error');

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

describe('AnalyticsApp when content types are not configured correctly', () => {
  it('renders SlugWarningDisplay component when slug field is not configured', async () => {
    vi.spyOn(useSidebarRules, 'useSidebarRules').mockImplementation(() => ({
      validRules: [],
      summaryLabel: '',
      isContentTypeWarning: true,
      warningRule: { id: 'rule-title', contentTypeId: 'category', slugField: 'slug', urlPrefix: '' },
    }));
    mockApi.mockImplementation(() => runReportResponseHasViews);
    const warningMessage = getContentTypeSpecificMsg('Category')
      .noSlugContentMsg.replace('app configuration page.', '')
      .trim();
    renderAnalyticsApp();

    const dropdown = queryByTestId(SELECT_TEST_ID);
    const warningNote = await findByTestId(NOTE_TEST_ID);
    const noteText = getByText(warningMessage);

    expect(dropdown).toBeFalsy();
    expect(warningNote).toBeVisible();
    expect(noteText).toBeVisible();
  });
});
