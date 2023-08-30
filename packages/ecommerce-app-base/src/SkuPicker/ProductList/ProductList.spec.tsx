import * as React from 'react';
import { render, cleanup } from '@testing-library/react';
import { Props, ProductList } from './ProductList';
import { productsList } from '../../__mocks__';

const defaultProps: Props = {
  products: productsList,
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
    expect(getAllByTestId('ProductListItem')).toHaveLength(productsList.length);
    for (const product of productsList) {
      expect(getByTestId(`product-preview-${product.sku}`)).toHaveAttribute(
        'aria-checked',
        'false'
      );
    }
  });

  it('should render successfully with selected items', () => {
    const selectedSKU = productsList[1].sku;
    const { getAllByTestId, getByTestId } = renderComponent({
      ...defaultProps,
      selectedSKUs: [selectedSKU],
    });
    expect(getAllByTestId('ProductListItem')).toHaveLength(productsList.length);
    for (const product of productsList) {
      expect(getByTestId(`product-preview-${product.sku}`)).toHaveAttribute(
        'aria-checked',
        selectedSKU === product.sku ? 'true' : 'false'
      );
    }
  });
});
