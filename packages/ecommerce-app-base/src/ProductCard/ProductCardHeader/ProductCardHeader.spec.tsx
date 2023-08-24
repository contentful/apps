import { ProductCardHeader } from './ProductCardHeader';
import { render, screen } from '@testing-library/react';
import * as React from 'react';

const { getByText, getAllByTestId } = screen;

describe('ProductCardHeader component', () => {
  it('mounts', () => {
    const headerTitle = 'Shopify product';
    render(<ProductCardHeader headerTitle={headerTitle} />);
    const titleElement = getByText(headerTitle);
    expect(titleElement).toBeVisible();
  });

  it('mounts showing header menu', () => {
    const headerTitle = 'Shopify product';
    render(<ProductCardHeader headerTitle={headerTitle} showHeaderMenu />);

    const titleElement = getByText(headerTitle);
    const buttons = getAllByTestId('cf-ui-icon-button');
    const menuButton = buttons[0];

    expect(titleElement).toBeVisible();
    expect(menuButton).toBeVisible();
    expect(menuButton).toHaveAttribute('aria-label', 'Actions');
  });
});
