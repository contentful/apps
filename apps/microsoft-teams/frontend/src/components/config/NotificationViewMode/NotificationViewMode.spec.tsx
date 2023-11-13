import NotificationViewMode from './NotificationViewMode';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { notificationsSection } from '@constants/configCopy';
import { defaultNotification } from '@constants/defaultParams';

describe('NotificationViewMode component', () => {
  it('mounts with correct copy', () => {
    const { unmount } = render(
      <NotificationViewMode
        index={0}
        updateNotification={vi.fn()}
        notification={defaultNotification}
        contentTypes={[]}
        handleEdit={vi.fn()}
      />
    );

    expect(screen.getByText(notificationsSection.enabledToggle)).toBeTruthy();
    expect(screen.getByText(notificationsSection.editButton)).toBeTruthy();
    unmount();
  });
  it('handles clicking the enable toggle', () => {
    const mockUpdateNotification = vi.fn();
    const { unmount } = render(
      <NotificationViewMode
        index={0}
        updateNotification={mockUpdateNotification}
        notification={defaultNotification}
        contentTypes={[]}
        handleEdit={vi.fn()}
      />
    );

    const enableToggle = screen.getByRole('switch');
    enableToggle.click();

    expect(mockUpdateNotification).toHaveBeenCalled();
    unmount();
  });
  it('handles clicking the edit button', () => {
    const mockHandleEdit = vi.fn();
    const { unmount } = render(
      <NotificationViewMode
        index={0}
        updateNotification={vi.fn()}
        notification={defaultNotification}
        contentTypes={[]}
        handleEdit={mockHandleEdit}
      />
    );

    const editButton = screen.getByText(notificationsSection.editButton);
    editButton.click();

    expect(mockHandleEdit).toHaveBeenCalled();
    unmount();
  });
});
