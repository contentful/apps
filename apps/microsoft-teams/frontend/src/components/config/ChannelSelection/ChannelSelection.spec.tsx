import ChannelSelection from './ChannelSelection';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { channelSelection } from '@constants/configCopy';
import { defaultNotification } from '@constants/defaultParams';
import { mockChannels } from '@test/mocks';
import { ChannelContext } from '@context/ChannelProvider';

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
    const { unmount } = render(
      <ChannelSelection
        notification={{
          ...defaultNotification,
          channel: mockChannels[0],
        }}
        handleNotificationEdit={vi.fn()}
      />
    );

    expect(screen.getByRole('textbox')).toBeTruthy();
    unmount();
  });

  it('mounts and does not render modal for channel selection if channels are loading', () => {
    const { unmount } = render(
      <ChannelContext.Provider value={{ loading: true, channels: [], error: undefined }}>
        <ChannelSelection notification={defaultNotification} handleNotificationEdit={vi.fn()} />
      </ChannelContext.Provider>
    );

    const addButton = screen.getByText(channelSelection.addButton);
    addButton.click();

    expect(screen.queryByTestId('cf-ui-modal')).toBeFalsy();
    unmount();
  });

  it('mounts and renders an error message if the saved channel is invalid', () => {
    const invalidNotification = {
      ...defaultNotification,
      channel: {
        id: 'not-valid-id',
        name: 'My channel',
        teamId: 'ed57f808-c14f-4a53-bf53-e36de0783385',
        tenantId: '666e56a6-1f2a-47c7-b88c-1ed9e1bb8668',
        teamName: 'Marketing Team',
      },
    };

    const { unmount } = render(
      <ChannelContext.Provider value={{ loading: false, channels: mockChannels, error: undefined }}>
        <ChannelSelection notification={invalidNotification} handleNotificationEdit={vi.fn()} />
      </ChannelContext.Provider>
    );

    expect(screen.getByText(channelSelection.notFound)).toBeTruthy();
    unmount();
  });
});
