import React from 'react';
import { ProductCardMenu } from './ProductCardMenu';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

const { getAllByLabelText } = screen;

const props = {
  onRemove: vi.fn(),
  isDataVisible: true,
};

describe('ProductCardMenu component', () => {
  it('mounts', () => {
    render(<ProductCardMenu {...props} />);

    const iconButton = getAllByLabelText('Actions')[0];

    expect(iconButton).toBeTruthy();
  });
});
