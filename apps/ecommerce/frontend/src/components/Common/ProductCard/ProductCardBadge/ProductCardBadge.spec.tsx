import ProductCardBadge from './ProductCardBadge';
import { render, screen } from '@testing-library/react';

const { getByText, getByTestId, queryByTestId } = screen;

describe('ProductCardBadge component', () => {
  it('mounts in default state', () => {
    render(<ProductCardBadge />);

    const productCardBadgeStyleWrapper = getByTestId('badge-style-wrapper');

    expect(productCardBadgeStyleWrapper).toBeVisible();
  });

  it('mounts showing header menu', () => {
    render(<ProductCardBadge showHeaderMenu />);

    const productCardBadgeStyleWrapper = queryByTestId('badge-style-wrapper');

    expect(productCardBadgeStyleWrapper).toBeFalsy();
  });

  it('mounts showing error state', () => {
    const externalResourceError = {
      error: 'Cannot fetch',
      errorMessage: 'Internal server error',
      errorStatus: 404,
    };
    render(<ProductCardBadge externalResourceError={externalResourceError} />);

    const errorText = getByText(externalResourceError.errorMessage);

    expect(errorText).toBeVisible();
  });
});
