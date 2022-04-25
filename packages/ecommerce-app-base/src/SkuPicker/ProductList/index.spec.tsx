import React from 'react';
import { render, cleanup, configure } from '@testing-library/react';
import { Props, ProductList } from '.';
import productPreviews from '../../__mocks__/productPreviews';

configure({
  testIdAttribute: 'data-test-id',
});

const defaultProps: Props = {
  products: productPreviews,
  selectProduct: jest.fn(),
  selectedSKUs: [],
};

const renderComponent = (props: Props) => {
  return render(<ProductList {...props} />);
};

describe('ProductList', () => {
  afterEach(cleanup);

  it('should render successfully with no items selected', async () => {
    const { getAllByTestId, getByTestId } = renderComponent(defaultProps);
    expect(getAllByTestId('ProductListItem')).toHaveLength(productPreviews.length);
    for (let product of productPreviews) {
      expect(getByTestId(`product-preview-${product.sku}`)).toHaveAttribute(
        'aria-checked',
        'false'
      );
    }
  });

  it('should render successfully with selected items', () => {
    const selectedSKU = productPreviews[1].sku;
    const { getAllByTestId, getByTestId } = renderComponent({
      ...defaultProps,
      selectedSKUs: [selectedSKU],
    });
    expect(getAllByTestId('ProductListItem')).toHaveLength(productPreviews.length);
    for (let product of productPreviews) {
      expect(getByTestId(`product-preview-${product.sku}`)).toHaveAttribute(
        'aria-checked',
        selectedSKU === product.sku ? 'true' : 'false'
      );
    }
  });
});
