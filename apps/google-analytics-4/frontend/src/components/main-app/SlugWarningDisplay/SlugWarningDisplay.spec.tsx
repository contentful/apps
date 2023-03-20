import SlugWarningDisplay from './SlugWarningDisplay';
import { render, screen } from '@testing-library/react';
import * as useSidebarSlug from 'hooks/useSidebarSlug';

const useSidebarSlugMock = {
  reportSlug: '',
  slugFieldValue: '',
  isContentTypeWarning: true,
};

const { findByText } = screen;

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
      "The content type has not been configured for use with this app. It must have a field of type short text and must be added to the list of content types in this app's configuration."
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

    const warningMsg = await findByText('This entry does not have a valid slug field.');
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

    const warningMsg = await findByText('This entry has not yet been published.');

    expect(warningMsg).toBeVisible();
  });
});
