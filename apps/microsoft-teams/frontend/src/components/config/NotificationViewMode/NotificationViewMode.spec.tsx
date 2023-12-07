import NotificationViewMode from './NotificationViewMode';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { notificationsSection } from '@constants/configCopy';
import { defaultNotification } from '@constants/defaultParams';
import { ContentTypeCustomRender } from '@test/helpers/ContentTypeCustomRender';
import { mockChannels } from '@test/mocks';

describe('NotificationViewMode component', () => {
  it('mounts with correct copy and menu', () => {
    const { unmount } = ContentTypeCustomRender(
      <NotificationViewMode
        index={0}
        updateNotification={vi.fn()}
        notification={defaultNotification}
        handleEdit={vi.fn()}
        isMenuDisabled={false}
        handleDelete={vi.fn()}
        channels={mockChannels}
      />
    );

    expect(screen.getByText(notificationsSection.enabledToggle)).toBeTruthy();
    expect(screen.getByRole('button')).toBeTruthy();
    unmount();
  });
  it('handles clicking the enable toggle', () => {
    const mockUpdateNotification = vi.fn();
    const { unmount } = ContentTypeCustomRender(
      <NotificationViewMode
        index={0}
        updateNotification={mockUpdateNotification}
        notification={defaultNotification}
        handleEdit={vi.fn()}
        isMenuDisabled={false}
        handleDelete={vi.fn()}
        channels={mockChannels}
      />
    );

    const enableToggle = screen.getByRole('switch');
    enableToggle.click();

    expect(mockUpdateNotification).toHaveBeenCalled();
    unmount();
  });
});
