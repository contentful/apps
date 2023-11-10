import ContentTypeSelection from './ContentTypeSelection';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { contentTypeSelection } from '@constants/configCopy';
import { defaultNotification } from '@constants/defaultParams';

describe('ContentTypeSelection component', () => {
  it('mounts and renders the correct title and button copy when no content type is selected', () => {
    const { unmount } = render(
      <ContentTypeSelection
        notification={defaultNotification}
        handleNotificationEdit={vi.fn()}
        contentTypes={[]}
      />
    );

    expect(screen.getByText(contentTypeSelection.title)).toBeTruthy();
    expect(screen.getByText(contentTypeSelection.addButton)).toBeTruthy();
    unmount();
  });
  it('mounts and renders an input when a content type is selected', () => {
    render(
      <ContentTypeSelection
        notification={{ ...defaultNotification, contentTypeId: 'blogPost' }}
        handleNotificationEdit={vi.fn()}
        contentTypes={[]}
      />
    );

    expect(screen.getByRole('textbox')).toBeTruthy();
  });
});
