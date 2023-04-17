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
import * as useSidebarSlug from 'hooks/useSidebarSlug/useSidebarSlug';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useAutoResizer: () => jest.fn(),
  useFieldValue: () => ['fieldValue'],
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

const mockApi = jest.fn();

const SELECT_TEST_ID = 'cf-ui-select';
const NOTE_TEST_ID = 'cf-ui-note';

describe('AnalyticsApp with correct content types configured', () => {
  beforeEach(() => {
    mockSdk.app.getParameters.mockReturnValue({
      serviceAccountKeyId: validServiceKeyId,
    });

    jest.spyOn(useSidebarSlug, 'useSidebarSlug').mockImplementation(() => ({
      slugFieldIsConfigured: true,
      contentTypeHasSlugField: true,
      isPublished: true,
      reportSlug: 'report slug',
      slugFieldValue: '',
      isContentTypeWarning: false,
    }));
  });

  it('mounts data', async () => {
    mockApi.mockImplementation(() => runReportResponseHasViews);
    render(
      <AnalyticsApp
        api={{ runReports: mockApi } as unknown as Api}
        propertyId="properties/12345"
        slugFieldInfo={{ slugField: 'title', urlPrefix: '' }}
      />
    );

    await screen.findByTestId(SELECT_TEST_ID);
    expect(screen.getByTestId(SELECT_TEST_ID)).toBeVisible();

    const chart = document.querySelector('canvas');
    expect(chart).toBeVisible();
  });

  it('mounts with warning message when no data', async () => {
    mockApi.mockImplementation(() => runReportResponseNoView);
    render(
      <AnalyticsApp
        api={{ runReports: mockApi } as unknown as Api}
        propertyId="properties/12345"
        slugFieldInfo={{ slugField: 'title', urlPrefix: '' }}
      />
    );

    await screen.findByTestId(SELECT_TEST_ID);

    expect(screen.getByTestId(SELECT_TEST_ID)).toBeVisible();
    expect(screen.getByTestId(NOTE_TEST_ID)).toBeVisible();
    expect(screen.getByText(EMPTY_DATA_MSG)).toBeVisible();
  });

  it('mounts with error message when error thrown', async () => {
    mockApi.mockRejectedValue(() => new Error('api error'));
    render(
      <AnalyticsApp
        api={{ runReports: mockApi } as unknown as Api}
        propertyId="properties/12345"
        slugFieldInfo={{ slugField: 'title', urlPrefix: '' }}
      />
    );

    await screen.findByTestId(SELECT_TEST_ID);

    expect(screen.getByTestId(SELECT_TEST_ID)).toBeVisible();
    expect(screen.getByTestId(NOTE_TEST_ID)).toBeVisible();
    expect(screen.getByText('api error')).toBeVisible();
  });

  it('renders nothing when it has no response', async () => {
    render(
      <AnalyticsApp
        api={{ runReports: mockApi } as unknown as Api}
        propertyId="properties/12345"
        slugFieldInfo={{ slugField: 'title', urlPrefix: '' }}
      />
    );

    expect(screen.queryByTestId(SELECT_TEST_ID)).toBeNull();
    expect(screen.queryByTestId(NOTE_TEST_ID)).toBeNull();
    expect(screen.queryByTestId('mock Api error')).toBeNull();
  });
});

describe('AnalyticsApp when content types are not configured correctly', () => {
  it('renders SlugWarningDisplay component when slug field is not configured', async () => {
    jest.spyOn(useSidebarSlug, 'useSidebarSlug').mockImplementation(() => ({
      slugFieldIsConfigured: true,
      contentTypeHasSlugField: false,
      isPublished: true,
      reportSlug: '',
      slugFieldValue: '',
      isContentTypeWarning: true,
    }));
    mockApi.mockImplementation(() => runReportResponseHasViews);
    const warningMessage = getContentTypeSpecificMsg('Category')
      .noSlugContentMsg.replace('app configuration page.', '')
      .trim();
    render(
      <AnalyticsApp
        api={{ runReports: mockApi } as unknown as Api}
        propertyId="properties/12345"
        slugFieldInfo={{ slugField: 'title', urlPrefix: '' }}
      />
    );

    await screen.findByTestId(NOTE_TEST_ID);

    expect(screen.queryByTestId(SELECT_TEST_ID)).toBeFalsy();
    expect(screen.getByTestId(NOTE_TEST_ID)).toBeVisible();
    expect(screen.getByText(warningMessage)).toBeVisible();
  });
});
