import NotificationEditModeFooter from './NotificationEditModeFooter';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { editModeFooter } from '@constants/configCopy';

describe('NotificationEditModeFooter component', () => {
  it('mounts with correct button copy', () => {
    const { unmount } = render(
      <NotificationEditModeFooter
        handleTest={vi.fn()}
        handleCancel={vi.fn()}
        handleSave={vi.fn()}
        isSaveDisabled={false}
        isTestSending={false}
        isTestDisabled={false}
        isNew={false}
      />
    );

    expect(screen.getByText(editModeFooter.test)).toBeTruthy();
    expect(screen.getByText(editModeFooter.cancel)).toBeTruthy();
    expect(screen.getByText(editModeFooter.update)).toBeTruthy();
    unmount();
  });
  it('displays create button when notification is new', () => {
    const { unmount } = render(
      <NotificationEditModeFooter
        handleTest={vi.fn()}
        handleCancel={vi.fn()}
        handleSave={vi.fn()}
        isSaveDisabled={false}
        isTestSending={false}
        isTestDisabled={false}
        isNew={true}
      />
    );

    expect(screen.getByText(editModeFooter.create)).toBeTruthy();
    unmount();
  });
  it('handles clicking the update button when it is enabled', () => {
    const mockHandleSave = vi.fn();
    const { unmount, rerender } = render(
      <NotificationEditModeFooter
        handleTest={vi.fn()}
        handleCancel={vi.fn()}
        handleSave={mockHandleSave}
        isSaveDisabled={false}
        isTestSending={false}
        isTestDisabled={false}
        isNew={false}
      />
    );

    const saveButton = screen.getByText(editModeFooter.update);
    saveButton.click();

    expect(mockHandleSave).toHaveBeenCalled();

    const mockHandleSaveDisabled = vi.fn();
    rerender(
      <NotificationEditModeFooter
        handleTest={vi.fn()}
        handleCancel={vi.fn()}
        handleSave={mockHandleSaveDisabled}
        isSaveDisabled={true}
        isTestSending={false}
        isTestDisabled={false}
        isNew={false}
      />
    );

    const saveButtonDisabled = screen.getByText(editModeFooter.update);
    saveButtonDisabled.click();

    expect(mockHandleSaveDisabled).not.toHaveBeenCalled();

    unmount();
  });
  it('handles clicking the cancel button when it is enabled', () => {
    const mockHandleCancel = vi.fn();
    const { unmount, rerender } = render(
      <NotificationEditModeFooter
        handleTest={vi.fn()}
        handleCancel={mockHandleCancel}
        handleSave={vi.fn()}
        isSaveDisabled={false}
        isTestSending={false}
        isTestDisabled={false}
        isNew={false}
      />
    );

    const cancelButton = screen.getByText(editModeFooter.cancel);
    cancelButton.click();

    expect(mockHandleCancel).toHaveBeenCalled();

    const mockHandleCancelDisabled = vi.fn();
    rerender(
      <NotificationEditModeFooter
        handleTest={vi.fn()}
        handleCancel={vi.fn()}
        handleSave={mockHandleCancelDisabled}
        isSaveDisabled={true}
        isTestSending={false}
        isTestDisabled={false}
        isNew={false}
      />
    );

    const cancelButtonDisabled = screen.getByText(editModeFooter.cancel);
    cancelButtonDisabled.click();

    expect(mockHandleCancelDisabled).not.toHaveBeenCalled();

    unmount();
  });
});
