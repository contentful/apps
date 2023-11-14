import EventsSelection from './EventsSelection';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { eventsSelection } from '@constants/configCopy';
import { defaultNotification } from '@constants/defaultParams';

describe('EventsSelection component', () => {
  it('mounts with correct options', () => {
    render(<EventsSelection notification={defaultNotification} handleNotificationEdit={vi.fn()} />);

    Object.values(eventsSelection.options).forEach((option) => {
      expect(screen.getByText(option.text)).toBeTruthy();
    });
  });
});
