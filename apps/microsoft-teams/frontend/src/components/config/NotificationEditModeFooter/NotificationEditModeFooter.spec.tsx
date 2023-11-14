import NotificationEditModeFooter from './NotificationEditModeFooter';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { editModeFooter } from '@constants/configCopy';

describe('NotificationEditModeFooter component', () => {
  it('mounts with correct button copy', () => {
    const { unmount } = render(
      <NotificationEditModeFooter handleSave={vi.fn()} handleDelete={vi.fn()} />
    );

    expect(screen.getByText(editModeFooter.test)).toBeTruthy();
    expect(screen.getByText(editModeFooter.delete)).toBeTruthy();
    expect(screen.getByText(editModeFooter.save)).toBeTruthy();
    unmount();
  });
  it('handles clicking the delete button', () => {
    const mockHandleDelete = vi.fn();
    const { unmount } = render(
      <NotificationEditModeFooter handleSave={vi.fn()} handleDelete={mockHandleDelete} />
    );

    const deleteButton = screen.getByText(editModeFooter.delete);
    deleteButton.click();

    expect(mockHandleDelete).toHaveBeenCalled();
    unmount();
  });
  it('handles clicking the save button', () => {
    const mockHandleSave = vi.fn();
    const { unmount } = render(
      <NotificationEditModeFooter handleSave={mockHandleSave} handleDelete={vi.fn()} />
    );

    const saveButton = screen.getByText(editModeFooter.save);
    saveButton.click();

    expect(mockHandleSave).toHaveBeenCalled();
    unmount();
  });
});
