import DeleteModal from './DeleteModal';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { editModeFooter } from '@constants/configCopy';

describe('DeleteModal component', () => {
  it('mounts and renders the correct content', () => {
    render(<DeleteModal isShown={true} handleCancel={vi.fn()} handleDelete={vi.fn()} />);

    expect(screen.getByText(editModeFooter.confirmDelete)).toBeTruthy();
  });
});
