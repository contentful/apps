import CancelModal from './CancelModal';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { editModeFooter } from '@constants/configCopy';

describe('CancelModal component', () => {
  it('mounts and renders the correct content', () => {
    render(<CancelModal isShown={true} handleCancel={vi.fn()} handleConfirm={vi.fn()} />);

    expect(screen.getByText(editModeFooter.confirmCancelDescription)).toBeTruthy();
  });
});
