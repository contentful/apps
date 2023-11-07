import AddButton from './AddButton';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('AddButton component', () => {
  it('mounts with correct button copy', () => {
    render(<AddButton buttonCopy="test" handleClick={vi.fn()} />);

    expect(screen.getByText('test')).toBeTruthy();
  });
});
