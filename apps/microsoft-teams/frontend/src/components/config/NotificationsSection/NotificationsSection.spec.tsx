import NotificationsSection from './NotificationsSection';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { notificationsSection } from '@constants/configCopy';

describe('NotificationsSection component', () => {
  it('mounts with title', async () => {
    render(<NotificationsSection />);

    expect(screen.getByText(notificationsSection.title)).toBeTruthy();
  });
});
