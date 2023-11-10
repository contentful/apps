import ChannelSelection from './ChannelSelection';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { channelSelection } from '@constants/configCopy';
import { defaultNotification } from '@constants/defaultParams';

describe('ChannelSelection component', () => {
  it('mounts and renders the correct title and button copy when no channel is selected', () => {
    const { unmount } = render(
      <ChannelSelection notification={defaultNotification} handleNotificationEdit={vi.fn()} />
    );

    expect(screen.getByText(channelSelection.title)).toBeTruthy();
    expect(screen.getByText(channelSelection.addButton)).toBeTruthy();
    unmount();
  });
  it('mounts and renders an input when a channel is selected', () => {
    render(
      <ChannelSelection
        notification={{ ...defaultNotification, channelId: 'abc-123' }}
        handleNotificationEdit={vi.fn()}
      />
    );

    expect(screen.getByRole('textbox')).toBeTruthy();
  });
});
