import * as React from 'react';
import { render, cleanup } from '@testing-library/react';
import { Props, ProductSelectionList } from './ProductSelectionList';
import { productsList } from '../../__mocks__';

const defaultProps: Props = {
  products: productsList,
  selectProduct: jest.fn(),
};

const renderComponent = (props: Props) => {
  return render(<ProductSelectionList {...props} />);
};

describe('ProductSelectionList', () => {
  afterEach(cleanup);

  it('should render successfully', async () => {
    const { getAllByTestId } = renderComponent(defaultProps);
    expect(getAllByTestId('product-selection-list-item')).toHaveLength(productsList.length);
  });
});
