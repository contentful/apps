import ContentTypeSelection from './ContentTypeSelection';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { contentTypeSelection } from '@constants/configCopy';
import { defaultNotification } from '@constants/defaultParams';
import { ContentTypeCustomRender } from '@test/helpers/ContentTypeCustomRender';

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
});
