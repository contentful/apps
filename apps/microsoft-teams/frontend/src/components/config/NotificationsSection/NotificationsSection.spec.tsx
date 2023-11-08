import NotificationsSection from './NotificationsSection';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { notificationsSection } from '@constants/configCopy';

describe('NotificationsSection component', () => {
  it('mounts with title', () => {
    render(<NotificationsSection notifications={[]} dispatch={vi.fn()} />);

    expect(screen.getByText(notificationsSection.title)).toBeTruthy();
  });
});
