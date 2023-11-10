import ChannelSelectionModal from './ChannelSelectionModal';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { channelSelection } from '@constants/configCopy';

describe('ChannelSelectionModal component', () => {
  it('mounts and renders the correct content', () => {
    render(
      <ChannelSelectionModal
        isShown={true}
        onClose={vi.fn()}
        savedChannelId=""
        handleNotificationEdit={vi.fn()}
      />
    );

    expect(screen.getByText(channelSelection.modal.button)).toBeTruthy();
  });
});
