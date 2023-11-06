import AddButton from './AddButton';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('AddButton component', () => {
  it('mounts with correct button copy', async () => {
    render(<AddButton buttonCopy="test" />);

    expect(screen.getByText('test')).toBeTruthy();
  });
});
