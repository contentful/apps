import ProductCardHeader from './ProductCardHeader';
import { render, screen } from '@testing-library/react';

const { getByText, getByTestId, getAllByTestId } = screen;

describe('ProductCardHeader component', () => {
  it('mounts', () => {
    const headerTitle = 'Shopify product';
    render(<ProductCardHeader headerTitle={headerTitle} />);

    const titleElement = getByText(headerTitle);

    expect(titleElement).toBeVisible();
  });

  it('mounts showing external link button', () => {
    const headerTitle = 'Shopify product';
    render(<ProductCardHeader headerTitle={headerTitle} showExternalResourceLinkDetails />);

    const titleElement = getByText(headerTitle);
    const externalLinkButton = getByTestId('cf-ui-icon-button');

    expect(titleElement).toBeVisible();
    expect(externalLinkButton).toBeVisible();
    expect(externalLinkButton).toHaveAttribute('aria-label', 'View external resource details');
  });

  it('mounts showing header menu', () => {
    const headerTitle = 'Shopify product';
    render(
      <ProductCardHeader headerTitle={headerTitle} showExternalResourceLinkDetails showHeaderMenu />
    );

    const titleElement = getByText(headerTitle);
    const buttons = getAllByTestId('cf-ui-icon-button');
    const menuButton = buttons[1];

    expect(titleElement).toBeVisible();
    expect(menuButton).toBeVisible();
    expect(menuButton).toHaveAttribute('aria-label', 'Actions');
  });
});
