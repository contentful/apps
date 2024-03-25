import NotificationViewMode from './NotificationViewMode';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { mockNotification } from '@test/mocks';
import { ContentTypeCustomRender } from '@test/helpers/ContentTypeCustomRender';

describe('NotificationViewMode component', () => {
  it('mounts with correct copy and menu button', () => {
    const { unmount } = ContentTypeCustomRender(
      <NotificationViewMode
        notification={mockNotification}
        handleEdit={vi.fn()}
        isMenuDisabled={false}
        handleDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Blog Post')).toBeTruthy();
    expect(screen.getByText('Corporate Marketing, Marketing Department')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'toggle menu' })).toBeTruthy();
    unmount();
  });
});
