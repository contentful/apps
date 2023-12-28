import ChannelSelectionModal from './ChannelSelectionModal';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { channelSelection } from '@constants/configCopy';
import { defaultNotification } from '@constants/defaultParams';

describe('ChannelSelectionModal component', () => {
  it('mounts and renders the correct content', () => {
    render(
      <ChannelSelectionModal
        isShown={true}
        onClose={vi.fn()}
        savedChannel={defaultNotification.channel}
        handleNotificationEdit={vi.fn()}
        channels={[]}
      />
    );

    expect(screen.getByText(channelSelection.modal.title)).toBeTruthy();
  });
});
