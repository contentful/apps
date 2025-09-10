import { ProductCard } from './ProductCard';
import { cleanup, render, screen } from '@testing-library/react';
import { productsList } from '../../__mocks__';
import React from 'react';
import { vi } from 'vitest';

const { getByText } = screen;

const product = productsList[0];

describe('ProductCard component', () => {
  afterEach(cleanup);

  it('mounts', () => {
    const mockOnSelect = vi.fn();
    render(<ProductCard title="Kleenex product" onSelect={mockOnSelect} resource={product} />);

    const productName = product.name!;
    const productDescription =
      'Open your door to the world of grilling with the sleek Spirit II E-210...';

    expect(getByText(productName)).toBeTruthy();
    expect(getByText(productDescription)).toBeTruthy();
  });

  it('handles onSelect', async () => {
    const mockOnSelect = vi.fn();
    render(<ProductCard title="Kleenex product" onSelect={mockOnSelect} resource={product} />);

    const productName = product.name!;
    getByText(productName).click();

    expect(mockOnSelect).toHaveBeenCalled();
  });
});
