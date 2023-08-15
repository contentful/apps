import * as React from 'react';
import ProductCardBadge from './ProductCardBadge';
import { render, screen } from '@testing-library/react';

const { getByText, getByTestId, queryByTestId } = screen;

describe('ProductCardBadge component', () => {
  it('mounts in default state', () => {
    render(<ProductCardBadge />);

    const productCardBadgeStyleWrapper = getByTestId('badge-style-wrapper');

    expect(productCardBadgeStyleWrapper).toBeVisible();
  });

  it('mounts showing header menu and default availability status', () => {
    render(<ProductCardBadge showHeaderMenu />);

    const productCardBadgeStyleWrapper = queryByTestId('badge-style-wrapper');
    const status = getByText('Not Available');

    expect(productCardBadgeStyleWrapper).toBeFalsy();
    expect(status).toBeVisible();
  });

  it('mounts showing status if provided', () => {
    render(
      <ProductCardBadge
        showHeaderMenu
        resource={{ title: 'Cheetos', description: 'yummy cheesy sticks', status: 'new' }}
      />
    );

    const productCardBadgeStyleWrapper = queryByTestId('badge-style-wrapper');
    const status = getByText('new');

    expect(productCardBadgeStyleWrapper).toBeFalsy();
    expect(status).toBeVisible();
  });

  it('mounts showing error state', () => {
    const externalResourceError = {
      error: 'Cannot fetch',
      errorMessage: 'Internal server error',
      errorStatus: 404,
    };
    render(<ProductCardBadge externalResourceError={externalResourceError} />);

    const errorText = getByText(externalResourceError.errorMessage);
    const productCardBadgeStyleWrapper = getByTestId('badge-style-wrapper');

    expect(errorText).toBeVisible();
    expect(productCardBadgeStyleWrapper).toBeVisible();
  });
});
