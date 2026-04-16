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

const { findAllByTestId, getByTestId, getByText, queryByTestId } = screen;

const SELECT_TEST_ID = 'cf-ui-select';
const NOTE_TEST_ID = 'cf-ui-note';
const stableValidRules = [
  {
    id: 'rule-title',
    contentTypeId: 'category',
    slugField: 'title',
    urlPrefix: '',
    reportSlug: 'report slug',
    enableAdvancedMatching: false,
  },
];
const stableSidebarRulesState = {
  validRules: stableValidRules,
  summaryLabel: 'report slug',
  isContentTypeWarning: false,
  warningRule: undefined,
  haveLoadedFieldValues: true,
};

const renderAnalyticsApp = () =>
  render(
    <AnalyticsApp
      api={{ runReports: mockApi } as unknown as Api}
      propertyId="properties/12345"
      slugFieldRules={[
        { id: 'rule-title', contentTypeId: 'category', slugField: 'title', urlPrefix: '' } as any,
      ]}
      openCustomRangeDialog={vi.fn()}
    />
  );

describe('AnalyticsApp with correct content types configured', () => {
  beforeEach(() => {
    mockApi.mockReset();
    mockSdk.app.getParameters.mockReturnValue({
      serviceAccountKeyId: validServiceKeyId,
    });
    mockSdk.entry = {
      onSysChanged: vi.fn((handler) => {
        handler({ publishedAt: '2026-04-16T00:00:00.000Z' });
        return vi.fn();
      }),
      fields: {
        title: {},
        slug: {},
      },
    };

    vi.spyOn(useSidebarRules, 'useSidebarRules').mockImplementation(() => stableSidebarRulesState);
  });

  it('mounts data', async () => {
    mockApi.mockImplementation(() => runReportResponseHasViews);
    renderAnalyticsApp();

    const dropdowns = await findAllByTestId(SELECT_TEST_ID);
    const chart = document.querySelector('canvas');

    expect(dropdowns).toHaveLength(2);
    expect(chart).toBeVisible();
  });

  it('mounts with warning message when no data', async () => {
    mockApi.mockImplementation(() => runReportResponseNoView);
    renderAnalyticsApp();

    const dropdowns = await findAllByTestId(SELECT_TEST_ID);
    const warningNote = getByTestId(NOTE_TEST_ID);
    const noteText = getByText(EMPTY_DATA_MSG);

    expect(dropdowns).toHaveLength(2);
    expect(warningNote).toBeVisible();
    expect(noteText).toBeVisible();
  });

  it('mounts with error message when error thrown', async () => {
    mockApi.mockRejectedValue(new Error('api error'));
    renderAnalyticsApp();

    const dropdowns = await findAllByTestId(SELECT_TEST_ID);
    const warningNote = getByTestId(NOTE_TEST_ID);
    const noteText = getByText('api error');

    expect(dropdowns).toHaveLength(2);
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
    mockSdk.entry = {
      onSysChanged: vi.fn((handler) => {
        handler({ publishedAt: '2026-04-16T00:00:00.000Z' });
        return vi.fn();
      }),
      fields: {
        title: {},
      },
    };
    const warningRule = {
      id: 'rule-title',
      contentTypeId: 'category',
      slugField: 'slug',
      urlPrefix: '',
    };
    vi.spyOn(useSidebarRules, 'useSidebarRules').mockImplementation(() => ({
      validRules: [],
      summaryLabel: '',
      isContentTypeWarning: true,
      haveLoadedFieldValues: true,
      warningRule,
    }));
    mockApi.mockImplementation(() => runReportResponseHasViews);
    const warningMessage = getContentTypeSpecificMsg('Category')
      .noSlugContentMsg.replace('app configuration page.', '')
      .trim();
    renderAnalyticsApp();

    const dropdown = queryByTestId(SELECT_TEST_ID);
    const warningNote = await screen.findByTestId(NOTE_TEST_ID);
    const noteText = getByText(warningMessage);

    expect(dropdown).toBeFalsy();
    expect(warningNote).toBeVisible();
    expect(noteText).toBeVisible();
  });
});
