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

const { findByText } = screen;

const { noSlugContentMsg, notPublishedMsg } = getContentTypeSpecificMsg('Category');

describe('SlugWarningDisplay for the analytics app', () => {
  it('mounts with correct msg', async () => {
    jest.spyOn(useSidebarSlug, 'useSidebarSlug').mockImplementation(() => ({
      slugFieldIsConfigured: false,
      contentTypeHasSlugField: false,
      isPublished: true,
      ...useSidebarSlugMock,
    }));

    render(<SlugWarningDisplay slugFieldInfo={{ slugField: '', urlPrefix: '' }} />);

    const warningMsg = await findByText(
      "The Category content type has not been configured for use with this app. It must have a field of type short text and must be added to the list of content types in this app's configuration."
    );
    expect(warningMsg).toBeVisible();
  });

  it('mounts with correct msg', async () => {
    jest.spyOn(useSidebarSlug, 'useSidebarSlug').mockImplementation(() => ({
      slugFieldIsConfigured: true,
      contentTypeHasSlugField: false,
      isPublished: true,
      ...useSidebarSlugMock,
    }));

    render(<SlugWarningDisplay slugFieldInfo={{ slugField: 'slug', urlPrefix: '' }} />);

    const warningMsg = await findByText(noSlugContentMsg);
    expect(warningMsg).toBeVisible();
  });

  it('mounts with correct msg', async () => {
    jest.spyOn(useSidebarSlug, 'useSidebarSlug').mockImplementation(() => ({
      slugFieldIsConfigured: true,
      contentTypeHasSlugField: true,
      isPublished: false,
      ...useSidebarSlugMock,
    }));

    render(<SlugWarningDisplay slugFieldInfo={{ slugField: 'slug', urlPrefix: '' }} />);

    const warningMsg = await findByText(notPublishedMsg);

    expect(warningMsg).toBeVisible();
  });
});
