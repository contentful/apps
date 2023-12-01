import NotificationEditMode from './NotificationEditMode';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { contentTypeSelection, channelSelection, eventsSelection } from '@constants/configCopy';
import { defaultNotification } from '@constants/defaultParams';
import { ContentTypeCustomRender } from '@test/helpers/ContentTypeCustomRender';

describe('NotificationEditMode component', () => {
  it('mounts with correct copy', () => {
    ContentTypeCustomRender(
      <NotificationEditMode
        index={0}
        deleteNotification={vi.fn()}
        updateNotification={vi.fn()}
        notification={defaultNotification}
        setNotificationIndexToEdit={vi.fn()}
      />
    );

    expect(screen.getByText(contentTypeSelection.title)).toBeTruthy();
    expect(screen.getByText(channelSelection.title)).toBeTruthy();
    expect(screen.getByText(eventsSelection.title)).toBeTruthy();
  });
});
