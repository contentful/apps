import { ProductCard } from './ProductCard';
import userEvent from '@testing-library/user-event';
import { cleanup, render, screen } from '@testing-library/react';
import { productsList } from '../../__mocks__';

const { getByText } = screen;

const product = productsList[0];

describe('ProductCard component', () => {
  afterEach(cleanup);

  it('mounts', () => {
    const mockOnSelect = jest.fn();
    render(<ProductCard title="Kleenex product" onSelect={mockOnSelect} resource={product} />);

    const productName = product.name!;
    const productDescription =
      'Open your door to the world of grilling with the sleek Spirit II E-210...';

    expect(getByText(productName)).toBeVisible();
    expect(getByText(productDescription)).toBeVisible();
  });

  it('handles onSelect', async () => {
    userEvent.setup();
    const mockOnSelect = jest.fn();
    render(<ProductCard title="Kleenex product" onSelect={mockOnSelect} resource={product} />);

    const productName = product.name!;
    await userEvent.click(getByText(productName));

    expect(mockOnSelect).toHaveBeenCalled();
  });
});
