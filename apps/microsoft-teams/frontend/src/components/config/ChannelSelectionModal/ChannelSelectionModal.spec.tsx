import ChannelSelectionModal from './ChannelSelectionModal';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { channelSelection } from '@constants/configCopy';
import { defaultNotification } from '@constants/defaultParams';

describe('ChannelSelectionModal component', () => {
  it('mounts and renders the empty state when no channels are present', () => {
    render(
      <ChannelSelectionModal
        isShown={true}
        onClose={vi.fn()}
        savedChannel={defaultNotification.channel}
        handleNotificationEdit={vi.fn()}
        channels={[]}
        loading={false}
        error={false}
      />
    );

    expect(screen.getByText(channelSelection.modal.title)).toBeTruthy();
    expect(screen.getByText(channelSelection.modal.emptyHeading)).toBeTruthy();
  });

  it('mounts and renders loading content when loading is true', () => {
    render(
      <ChannelSelectionModal
        isShown={true}
        onClose={vi.fn()}
        savedChannel={defaultNotification.channel}
        handleNotificationEdit={vi.fn()}
        channels={[]}
        loading={true}
        error={false}
      />
    );

    expect(screen.getByTestId('channels-loading')).toBeTruthy();
  });

  it('mounts and renders error content when error is present', () => {
    const { errorMessage } = channelSelection.modal;
    render(
      <ChannelSelectionModal
        isShown={true}
        onClose={vi.fn()}
        savedChannel={defaultNotification.channel}
        handleNotificationEdit={vi.fn()}
        channels={[]}
        loading={false}
        error={true}
      />
    );

    expect(screen.getByText(errorMessage)).toBeTruthy();
  });
});
