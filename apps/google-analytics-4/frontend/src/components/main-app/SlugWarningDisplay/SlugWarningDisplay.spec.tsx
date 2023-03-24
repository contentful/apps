import SlugWarningDisplay from './SlugWarningDisplay';
import { render, screen } from '@testing-library/react';
import { mockSdk } from '../../../../test/mocks';
import { getContentTypeSpecificMsg } from '../constants/noteMessages';
import * as useSidebarSlug from 'hooks/useSidebarSlug/useSidebarSlug';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

const useSidebarSlugMock = {
  reportSlug: '',
  slugFieldValue: '',
  isContentTypeWarning: true,
};

const HYPER_LINK_MSG = 'app configuration page.';

const { findByText, queryByText, getByTestId } = screen;

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

    const warningMsg = await findByText(noSlugConfigMsg.replace(HYPER_LINK_MSG, '').trim());
    const hyperLink = getByTestId('cf-ui-text-link');

    expect(warningMsg).toBeVisible();
    expect(hyperLink).toBeVisible();
  });

  it('mounts with correct msg and hyperlink when error is missing slug field', async () => {
    jest.spyOn(useSidebarSlug, 'useSidebarSlug').mockImplementation(() => ({
      slugFieldIsConfigured: true,
      contentTypeHasSlugField: false,
      isPublished: true,
      ...useSidebarSlugMock,
    }));

    render(<SlugWarningDisplay slugFieldInfo={{ slugField: 'slug', urlPrefix: '' }} />);

    const warningMsg = await findByText(noSlugContentMsg.replace(HYPER_LINK_MSG, '').trim());
    const hyperLink = getByTestId('cf-ui-text-link');

    expect(warningMsg).toBeVisible();
    expect(hyperLink).toBeVisible();
  });

  it('mounts with correct msg and no hyperlink, when error is unpublished content', async () => {
    jest.spyOn(useSidebarSlug, 'useSidebarSlug').mockImplementation(() => ({
      slugFieldIsConfigured: true,
      contentTypeHasSlugField: true,
      isPublished: false,
      ...useSidebarSlugMock,
    }));

    render(<SlugWarningDisplay slugFieldInfo={{ slugField: 'slug', urlPrefix: '' }} />);

    const warningMsg = await findByText(notPublishedMsg);
    const hyperLinkMsg = queryByText(HYPER_LINK_MSG);

    expect(warningMsg).toBeVisible();
    expect(hyperLinkMsg).toBeFalsy();
  });
});
