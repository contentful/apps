import ContentTypeSelection from './ContentTypeSelection';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { contentTypeSelection } from '@constants/configCopy';
import { defaultNotification } from '@constants/defaultParams';
import { ContentTypeCustomRender } from '@test/helpers/ContentTypeCustomRender';
import { ContentTypeContext } from '@context/ContentTypeProvider';

describe('ContentTypeSelection component', () => {
  it('mounts and renders the correct title and button copy when no content type is selected', () => {
    const { unmount } = ContentTypeCustomRender(
      <ContentTypeSelection
        notification={defaultNotification}
        handleNotificationEdit={vi.fn()}></ContentTypeSelection>
    );

    expect(screen.getByText(contentTypeSelection.title)).toBeTruthy();
    expect(screen.getByText(contentTypeSelection.addButton)).toBeTruthy();
    unmount();
  });

  it('mounts and renders an input when a content type is selected', () => {
    const { unmount } = ContentTypeCustomRender(
      <ContentTypeSelection
        notification={{ ...defaultNotification, contentTypeId: 'blogPost' }}
        handleNotificationEdit={vi.fn()}></ContentTypeSelection>
    );

    expect(screen.getByRole('textbox')).toBeTruthy();
    unmount();
  });

  it('mounts and does not render modal for content type selection if channels are loading', () => {
    const { unmount } = ContentTypeCustomRender(
      <ContentTypeContext.Provider
        value={{
          contentTypesLoading: true,
          contentTypes: [],
          contentTypesError: undefined,
          contentTypeConfigLink: '',
        }}>
        <ContentTypeSelection notification={defaultNotification} handleNotificationEdit={vi.fn()} />
      </ContentTypeContext.Provider>
    );

    const addButton = screen.getByText(contentTypeSelection.addButton);
    addButton.click();

    expect(screen.queryByTestId('cf-ui-modal')).toBeFalsy();
    unmount();
  });
});
