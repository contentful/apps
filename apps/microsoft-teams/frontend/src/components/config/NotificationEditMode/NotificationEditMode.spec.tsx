import NotificationEditMode from './NotificationEditMode';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { contentTypeSection, channelSection, actionsSection } from '@constants/configCopy';

describe('NotificationEditMode component', () => {
  it('mounts with correct copy', () => {
    render(<NotificationEditMode index={0} handleDelete={vi.fn()} />);

    expect(screen.getByText(contentTypeSection.title)).toBeTruthy();
    expect(screen.getByText(channelSection.title)).toBeTruthy();
    expect(screen.getByText(actionsSection.title)).toBeTruthy();
  });
});
