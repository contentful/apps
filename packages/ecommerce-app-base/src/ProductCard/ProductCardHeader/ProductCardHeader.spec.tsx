import { ProductCardHeader } from './ProductCardHeader';
import { render, screen } from '@testing-library/react';
import * as React from 'react';

const { getByText, getByLabelText } = screen;

describe('ProductCardHeader component', () => {
  it('mounts', () => {
    const headerTitle = 'Shopify product';
    render(<ProductCardHeader headerTitle={headerTitle} />);
    const titleElement = getByText(headerTitle);
    expect(titleElement).toBeTruthy();
  });

  it('mounts showing header menu', () => {
    const headerTitle = 'Shopify product';
    render(<ProductCardHeader headerTitle={headerTitle} showHeaderMenu />);

    const titleElement = getByText(headerTitle);
    const menuButton = getByLabelText('Actions');

    expect(titleElement).toBeTruthy();
    expect(menuButton).toBeTruthy();
  });
});
