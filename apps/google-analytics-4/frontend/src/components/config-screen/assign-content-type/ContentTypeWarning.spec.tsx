import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContentTypeWarning from 'components/config-screen/assign-content-type/ContentTypeWarning';
import {
  NO_SLUG_WARNING_MSG,
  REMOVED_FROM_SIDEBAR_WARNING_MSG,
  getContentTypeDeletedMsg,
  getSlugFieldDeletedMsg,
} from 'components/config-screen/WarningDisplay/constants/warningMessages';

describe('Content Type Warning for Config Screen', () => {
  it('renders an empty div if there are no warnings or errors', () => {
    render(
      <ContentTypeWarning
        contentTypeId={'test'}
        slugField={'slug'}
        isSaved={false}
        isInSidebar={false}
        isContentTypeInOptions={true}
        isSlugFieldInOptions={true}
      />
    );

    expect(screen.getByTestId('noStatus')).toBeInTheDocument();
  });

  it('renders an error icon and correct tooltip content when content type is deleted', async () => {
    render(
      <ContentTypeWarning
        contentTypeId={'test'}
        slugField={'slug'}
        isSaved={true}
        isInSidebar={false}
        isContentTypeInOptions={false}
        isSlugFieldInOptions={false}
      />
    );

    expect(screen.getByTestId('errorIcon')).toBeInTheDocument();

    const user = userEvent.setup({ delay: 100 });
    await user.hover(screen.getByTestId('cf-ui-icon'));

    expect(screen.getByRole('tooltip').textContent).toBe(getContentTypeDeletedMsg('test'));
  });

  it('renders a warning icon and correct tooltip content when slug field empty', async () => {
    render(
      <ContentTypeWarning
        contentTypeId={'test'}
        slugField={''}
        isSaved={false}
        isInSidebar={true}
        isContentTypeInOptions={true}
        isSlugFieldInOptions={false}
      />
    );

    expect(screen.getByTestId('warningIcon')).toBeInTheDocument();

    const user = userEvent.setup({ delay: 100 });
    await user.hover(screen.getByTestId('cf-ui-icon'));

    expect(screen.getByRole('tooltip').textContent).toBe(NO_SLUG_WARNING_MSG);
  });

  it('renders a warning icon and correct tooltip content when app is removed from content type sidebar', async () => {
    render(
      <ContentTypeWarning
        contentTypeId={'test'}
        slugField={'slug'}
        isSaved={true}
        isInSidebar={false}
        isContentTypeInOptions={true}
        isSlugFieldInOptions={true}
      />
    );

    expect(screen.getByTestId('warningIcon')).toBeInTheDocument();

    const user = userEvent.setup({ delay: 100 });
    await user.hover(screen.getByTestId('cf-ui-icon'));

    expect(screen.getByRole('tooltip').textContent).toBe(REMOVED_FROM_SIDEBAR_WARNING_MSG);
  });

  it('renders a warning icon and correct tooltip content when slug field is deleted', async () => {
    await render(
      <ContentTypeWarning
        contentTypeId={'test'}
        slugField={'slug'}
        isSaved={true}
        isInSidebar={true}
        isContentTypeInOptions={true}
        isSlugFieldInOptions={false}
      />
    );

    expect(screen.getByTestId('warningIcon')).toBeInTheDocument();

    const user = userEvent.setup({ delay: 100 });
    await user.hover(screen.getByTestId('cf-ui-icon'));

    expect(screen.getByRole('tooltip').textContent).toBe(getSlugFieldDeletedMsg('test', 'slug'));
  });
});
