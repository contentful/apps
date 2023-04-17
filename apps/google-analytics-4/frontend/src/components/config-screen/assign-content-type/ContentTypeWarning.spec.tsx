import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContentTypeWarning from 'components/config-screen/assign-content-type/ContentTypeWarning';
import {
  NO_SLUG_WARNING_MSG,
  REMOVED_FROM_SIDEBAR_WARNING_MSG,
  getContentTypeDeletedMsg,
  getSlugFieldDeletedMsg,
} from 'components/config-screen/WarningDisplay/constants/warningMessages';

xdescribe('Content Type Warning for Config Screen', () => {
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

    await screen.findByTestId('cf-ui-icon');
    expect(screen.getByTestId('cf-ui-icon')).toBeInTheDocument();

    await userEvent.hover(screen.getByTestId('cf-ui-icon'));
    await screen.findByRole('tooltip');

    expect(screen.getByRole('tooltip').textContent).toBe(getContentTypeDeletedMsg('test'));
    await userEvent.unhover(screen.getByTestId('cf-ui-icon'));
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

    await screen.findByTestId('cf-ui-icon');
    expect(screen.getByTestId('cf-ui-icon')).toBeInTheDocument();

    await userEvent.hover(screen.getByTestId('cf-ui-icon'));
    await screen.findByRole('tooltip');

    expect(screen.getByRole('tooltip').textContent).toBe(NO_SLUG_WARNING_MSG);
    await userEvent.unhover(screen.getByTestId('cf-ui-icon'));
  });

  it('renders a warning icon and correct tooltip content when slug field is deleted', async () => {
    render(
      <ContentTypeWarning
        contentTypeId={'test'}
        slugField={'slug'}
        isSaved={true}
        isInSidebar={true}
        isContentTypeInOptions={true}
        isSlugFieldInOptions={false}
      />
    );
    await screen.findByTestId('warningIcon');
    expect(screen.getByTestId('warningIcon')).toBeInTheDocument();

    await userEvent.hover(screen.getByTestId('cf-ui-icon'));
    await screen.findByRole('tooltip');

    expect(screen.getByRole('tooltip').textContent).toBe(getSlugFieldDeletedMsg('test', 'slug'));
    await userEvent.unhover(screen.getByTestId('cf-ui-icon'));
  });
});

describe('Content Type Warning for Config Screen Flakey', () => {
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

    await screen.findByTestId('cf-ui-icon');
    expect(screen.getByTestId('cf-ui-icon')).toBeInTheDocument();
    await userEvent.hover(screen.getByTestId('cf-ui-icon'));

    await screen.findByRole('tooltip');
    expect(screen.getByRole('tooltip').textContent).toBe(REMOVED_FROM_SIDEBAR_WARNING_MSG);
    await userEvent.unhover(screen.getByTestId('cf-ui-icon'));
  });
});
