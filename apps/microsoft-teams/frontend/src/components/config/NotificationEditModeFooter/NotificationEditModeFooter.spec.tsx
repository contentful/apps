import NotificationEditModeFooter from './NotificationEditModeFooter';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { editModeFooter } from '@constants/configCopy';

describe('NotificationEditModeFooter component', () => {
  it('mounts with correct button copy', () => {
    const { unmount } = render(
      <NotificationEditModeFooter
        handleSave={vi.fn()}
        handleDelete={vi.fn()}
        isSaveDisabled={false}
      />
    );

    expect(screen.getByText(editModeFooter.test)).toBeTruthy();
    expect(screen.getByText(editModeFooter.delete)).toBeTruthy();
    expect(screen.getByText(editModeFooter.save)).toBeTruthy();
    unmount();
  });
  it('handles clicking the delete button', () => {
    const mockHandleDelete = vi.fn();
    const { unmount } = render(
      <NotificationEditModeFooter
        handleSave={vi.fn()}
        handleDelete={mockHandleDelete}
        isSaveDisabled={false}
      />
    );

    const deleteButton = screen.getByText(editModeFooter.delete);
    deleteButton.click();

    expect(mockHandleDelete).toHaveBeenCalled();
    unmount();
  });
  it('handles clicking the save button when it is enabled', () => {
    const mockHandleSave = vi.fn();
    const { unmount, rerender } = render(
      <NotificationEditModeFooter
        handleSave={mockHandleSave}
        handleDelete={vi.fn()}
        isSaveDisabled={false}
      />
    );

    const saveButton = screen.getByText(editModeFooter.save);
    saveButton.click();

    expect(mockHandleSave).toHaveBeenCalled();

    const mockHandleSaveDisabled = vi.fn();
    rerender(
      <NotificationEditModeFooter
        handleSave={mockHandleSaveDisabled}
        handleDelete={vi.fn()}
        isSaveDisabled={true}
      />
    );

    const saveButtonDisabled = screen.getByText(editModeFooter.save);
    saveButtonDisabled.click();

    expect(mockHandleSaveDisabled).not.toHaveBeenCalled();

    unmount();
  });
});
