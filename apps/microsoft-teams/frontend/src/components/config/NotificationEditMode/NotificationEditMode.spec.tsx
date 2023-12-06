import NotificationEditMode from './NotificationEditMode';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { contentTypeSelection, channelSelection, eventsSelection } from '@constants/configCopy';
import { defaultNotification } from '@constants/defaultParams';
import { mockSdk } from '@test/mocks';

describe('NotificationEditMode component', () => {
  it('mounts with correct copy', () => {
    render(
      <NotificationEditMode
        index={0}
        deleteNotification={vi.fn()}
        updateNotification={vi.fn()}
        notification={defaultNotification}
        contentTypes={[]}
        setNotificationIndexToEdit={vi.fn()}
        sdk={mockSdk}
      />
    );

    expect(screen.getByText(contentTypeSelection.title)).toBeTruthy();
    expect(screen.getByText(channelSelection.title)).toBeTruthy();
    expect(screen.getByText(eventsSelection.title)).toBeTruthy();
  });
});
