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
        isEditDisabled={false}
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
        isEditDisabled={false}
      />
    );

    const enableToggle = screen.getByRole('switch');
    enableToggle.click();

    expect(mockUpdateNotification).toHaveBeenCalled();
    unmount();
  });
  it('handles clicking the edit button when it is enabled', () => {
    const mockHandleEdit = vi.fn();
    const { unmount, rerender } = render(
      <NotificationViewMode
        index={0}
        updateNotification={vi.fn()}
        notification={defaultNotification}
        contentTypes={[]}
        handleEdit={mockHandleEdit}
        isEditDisabled={false}
      />
    );

    const editButton = screen.getByText(notificationsSection.editButton);
    editButton.click();

    expect(mockHandleEdit).toHaveBeenCalled();

    const mockHandleEditDisabled = vi.fn();
    rerender(
      <NotificationViewMode
        index={0}
        updateNotification={vi.fn()}
        notification={defaultNotification}
        contentTypes={[]}
        handleEdit={mockHandleEdit}
        isEditDisabled={true}
      />
    );

    const editButtonDisabled = screen.getByText(notificationsSection.editButton);
    editButtonDisabled.click();

    expect(mockHandleEditDisabled).not.toHaveBeenCalled();

    unmount();
  });
});
