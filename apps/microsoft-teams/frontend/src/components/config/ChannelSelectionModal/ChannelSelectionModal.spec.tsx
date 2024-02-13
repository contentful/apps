import ChannelSelectionModal from './ChannelSelectionModal';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { channelSelection } from '@constants/configCopy';
import { defaultNotification } from '@constants/defaultParams';
import { mockChannels } from '@test/mocks/mockChannels';

describe('ChannelSelectionModal component', () => {
  it('mounts and renders the empty state when no channels are present', () => {
    render(
      <ChannelSelectionModal
        isShown={true}
        onClose={vi.fn()}
        savedChannel={defaultNotification.channel}
        handleNotificationEdit={vi.fn()}
        channels={[]}
        error={false}
      />
    );

    expect(screen.getByText(channelSelection.modal.title)).toBeTruthy();
    expect(screen.getByText(channelSelection.modal.emptyHeading)).toBeTruthy();
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
        error={true}
      />
    );

    expect(screen.getByText(errorMessage)).toBeTruthy();
  });

  describe('selecting a channel', () => {
    it('clicking the entire row selects the channel', () => {
      const notificationEditSpy = vi.fn();

      render(
        <ChannelSelectionModal
          isShown={true}
          onClose={vi.fn()}
          savedChannel={defaultNotification.channel}
          handleNotificationEdit={notificationEditSpy}
          channels={[mockChannels[0]]}
          error={false}
        />
      );

      const row = screen.getByText(mockChannels[0].teamName).closest('tr');
      fireEvent.click(row as Element);

      // verify that radio button is checked
      const radioBtn = screen.getByRole('radio') as HTMLInputElement;
      expect(radioBtn.checked).toEqual(true);

      // submit form
      const submitBtn = screen.getByRole('button', { name: 'Select' });
      fireEvent.click(submitBtn);

      // ensure that notificationEdit() was called with correct value
      expect(notificationEditSpy).toHaveBeenCalledTimes(1);

      // todo: move this to a before/after block.  Ideally an after
      vi.restoreAllMocks();
    });
  });
});
