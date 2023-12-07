import AddButton from './AddButton';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('AddButton component', () => {
  it('mounts with correct button copy', () => {
    const { unmount } = render(<AddButton buttonCopy="test" handleClick={vi.fn()} />);

    expect(screen.getByText('test')).toBeTruthy();
    unmount();
  });
  it('is disabled when prop is true', () => {
    const { unmount } = render(
      <AddButton buttonCopy="test" handleClick={vi.fn()} isDisabled={true} />
    );

    expect(screen.getByRole('button')).toHaveProperty('disabled');
    unmount();
  });
});
