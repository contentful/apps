import SlugWarningDisplay from './SlugWarningDisplay';
import { render, screen } from '@testing-library/react';
import { mockSdk } from '../../../../test/mocks';
import { getContentTypeSpecificMsg, DEFAULT_ERR_MSG } from '../constants/noteMessages';
import * as useSidebarSlug from 'hooks/useSidebarSlug/useSidebarSlug';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

const useSidebarSlugMock = {
  reportSlug: '',
  slugFieldValue: '',
  isContentTypeWarning: true,
};

const APP_CONFIG_HYPER_LINK_MSG = 'app configuration page.';

const { noSlugConfigMsg, noSlugContentMsg, notPublishedMsg } =
  getContentTypeSpecificMsg('Category');

describe('SlugWarningDisplay for the analytics app', () => {
  it('mounts with correct msg and hyperlink when error is missing content type config', async () => {
    jest.spyOn(useSidebarSlug, 'useSidebarSlug').mockImplementation(() => ({
      slugFieldIsConfigured: false,
      contentTypeHasSlugField: false,
      isPublished: true,
      ...useSidebarSlugMock,
    }));

    render(<SlugWarningDisplay slugFieldInfo={{ slugField: '', urlPrefix: '' }} />);

    expect(
      screen.findByText(noSlugConfigMsg.replace(APP_CONFIG_HYPER_LINK_MSG, '').trim())
    ).toBeVisible();
    expect(screen.getByTestId('cf-ui-text-link')).toBeVisible();
  });

  it('mounts with correct msg and hyperlink when error is missing slug field', async () => {
    jest.spyOn(useSidebarSlug, 'useSidebarSlug').mockImplementation(() => ({
      slugFieldIsConfigured: true,
      contentTypeHasSlugField: false,
      isPublished: true,
      ...useSidebarSlugMock,
    }));

    render(<SlugWarningDisplay slugFieldInfo={{ slugField: 'slug', urlPrefix: '' }} />);

    expect(
      screen.findByText(noSlugContentMsg.replace(APP_CONFIG_HYPER_LINK_MSG, '').trim())
    ).toBeVisible();
    expect(screen.getByTestId('cf-ui-text-link')).toBeVisible();
  });

  it('mounts with correct msg and no hyperlink, when error is unpublished content', async () => {
    jest.spyOn(useSidebarSlug, 'useSidebarSlug').mockImplementation(() => ({
      slugFieldIsConfigured: true,
      contentTypeHasSlugField: true,
      isPublished: false,
      ...useSidebarSlugMock,
    }));

    render(<SlugWarningDisplay slugFieldInfo={{ slugField: 'slug', urlPrefix: '' }} />);

    expect(screen.findByText(notPublishedMsg)).toBeVisible();
    expect(screen.queryByText(APP_CONFIG_HYPER_LINK_MSG)).toBeFalsy();
  });

  it('mounts with correct msg and hyperlink as default message', async () => {
    const SUPPORT_LINK_MSG = 'contact support.';
    jest.spyOn(useSidebarSlug, 'useSidebarSlug').mockImplementation(() => ({
      slugFieldIsConfigured: true,
      contentTypeHasSlugField: true,
      isPublished: true,
      ...useSidebarSlugMock,
    }));

    render(<SlugWarningDisplay slugFieldInfo={{ slugField: 'slug', urlPrefix: '' }} />);

    expect(screen.findByText(DEFAULT_ERR_MSG.replace(SUPPORT_LINK_MSG, '').trim())).toBeVisible();
    expect(screen.getByTestId('cf-ui-text-link')).toBeVisible();
  });
});
