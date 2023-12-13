import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { notificationsSection } from '@constants/configCopy';
import DuplicateModal from './DuplicateModal';

describe('DeleteModal component', () => {
  it('mounts and renders the correct content', () => {
    render(<DuplicateModal isShown={true} handleCancel={vi.fn()} handleConfirm={vi.fn()} />);

    expect(screen.getByText(notificationsSection.duplicateModal.confirmDuplicate)).toBeTruthy();
  });
});
