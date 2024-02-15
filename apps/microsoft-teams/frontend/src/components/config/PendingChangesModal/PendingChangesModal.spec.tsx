import PendingChangesModal from './PendingChangesModal';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { notificationsSection } from '@constants/configCopy';

describe('DisconnectModal component', () => {
  it('mounts and renders the correct content', () => {
    render(<PendingChangesModal isShown={true} onClose={vi.fn()} />);

    expect(screen.getByText(notificationsSection.pendingChangesModal.description)).toBeTruthy();
  });
});
