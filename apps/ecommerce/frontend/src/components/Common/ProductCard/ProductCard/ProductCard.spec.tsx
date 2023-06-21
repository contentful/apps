import ProductCard from './ProductCard';
import { externalResource } from '../../../../../test/mocks';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

const { getByText } = screen;

describe('ProductCard component', () => {
  it('mounts', () => {
    render(
      <ProductCard cardHeader="Kleenex product" onSelect={() => {}} resource={externalResource} />
    );

    const productName = externalResource.title!;
    const productDescription = externalResource.description!;

    expect(getByText(productName)).toBeVisible();
    expect(getByText(productDescription)).toBeVisible();
  });

  it('handles onSelect', async () => {
    userEvent.setup();
    const mockOnSelect = jest.fn();
    render(
      <ProductCard
        cardHeader="Kleenex product"
        onSelect={mockOnSelect}
        resource={externalResource}
      />
    );

    const productName = externalResource.title!;
    await userEvent.click(getByText(productName));

    expect(mockOnSelect).toHaveBeenCalled();
  });
});
