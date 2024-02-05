import DisconnectModal from './DisconnectModal';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { accessSection } from '@constants/configCopy';

describe('DisconnectModal component', () => {
  it('mounts and renders the correct content', () => {
    render(<DisconnectModal isShown={true} handleCancel={vi.fn()} handleDisconnect={vi.fn()} />);

    expect(screen.getByText(accessSection.disconnectModal.confirmDisonnect)).toBeTruthy();
  });
});
