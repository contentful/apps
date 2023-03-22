import { useSidebarSlug } from './useSidebarSlug';
import * as useSDK from '@contentful/react-apps-toolkit';
import * as getFieldValue from '../useGetFieldValue';

jest.mock('@contentful/react-apps-toolkit', () => ({ useSDK: jest.fn() }));

jest.mock('../useGetFieldValue', () => jest.fn());

describe('useSidebarSlug hook', () => {
  it('returns slug info and status when all content types configured correctly', () => {
    jest.spyOn(useSDK, 'useSDK').mockImplementation(() => ({
      ...jest.requireActual('@contentful/react-apps-toolkit'),
      entry: {
        fields: { slugField: {} },
        getSys: () => ({ publishedAt: '20230320' }),
      },
    }));
    jest.spyOn(getFieldValue, 'default').mockImplementation(() => '/fieldValue');
    const slugFieldInfo = { slugField: 'slugField', urlPrefix: '/en-US' };

    const {
      slugFieldIsConfigured,
      contentTypeHasSlugField,
      isPublished,
      reportSlug,
      slugFieldValue,
      isContentTypeWarning,
    } = useSidebarSlug(slugFieldInfo);

    expect(slugFieldIsConfigured).toBe(true);
    expect(contentTypeHasSlugField).toBe(true);
    expect(isPublished).toBe(true);
    expect(reportSlug).toBe('/en-US/fieldValue');
    expect(slugFieldValue).toBe('/fieldValue');
    expect(isContentTypeWarning).toBe(false);
  });

  it('returns slug info and status when content types not configured correctly', () => {
    jest.spyOn(useSDK, 'useSDK').mockImplementation(() => ({
      ...jest.requireActual('@contentful/react-apps-toolkit'),
      entry: {
        fields: {},
        getSys: () => ({ publishedAt: '' }),
      },
    }));
    jest.spyOn(getFieldValue, 'default').mockImplementation(() => '');

    const slugFieldInfo = { slugField: '', urlPrefix: '/en-US' };

    const {
      slugFieldIsConfigured,
      contentTypeHasSlugField,
      isPublished,
      reportSlug,
      slugFieldValue,
      isContentTypeWarning,
    } = useSidebarSlug(slugFieldInfo);

    expect(slugFieldIsConfigured).toBe(false);
    expect(contentTypeHasSlugField).toBe(false);
    expect(isPublished).toBe(false);
    expect(reportSlug).toBe('/en-US');
    expect(slugFieldValue).toBe('');
    expect(isContentTypeWarning).toBe(true);
  });
});
