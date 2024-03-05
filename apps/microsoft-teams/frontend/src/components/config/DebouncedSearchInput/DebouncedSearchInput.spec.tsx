import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DebouncedSearchInput from './DebouncedSearchInput';

describe('ContentTypeSearch component', () => {
  it('mounts and renders the correct content', () => {
    const placeholderText = 'write some text here';
    const { unmount } = render(
      <DebouncedSearchInput placeholder={placeholderText} onChange={vi.fn()} />
    );

    expect(screen.getByPlaceholderText(placeholderText)).toBeTruthy();
    unmount();
  });
});
