import React from 'react';
import { fireEvent, configure, render, cleanup } from '@testing-library/react';
import { Props, ProductListItem } from './ProductListItem';
import productPreviews from '../../__mocks__/productPreviews';

configure({
  testIdAttribute: 'data-test-id',
});

const defaultProps: Props = {
  product: productPreviews[0],
  selectProduct: jest.fn(),
  isSelected: false,
};

const renderComponent = (props: Props) => {
  return render(<ProductListItem {...props} />);
};

describe('ProductListItem', () => {
  afterEach(cleanup);

  it('should render successfully', async () => {
    const { getByTestId } = renderComponent(defaultProps);
    const image = getByTestId('image');
    fireEvent(image, new Event('load'));
    expect(image).toHaveStyle('display: block');
  });

  it('should render successfully the isSelected variation', () => {
    const { getByTestId, getByRole } = renderComponent({ ...defaultProps, isSelected: true });
    const image = getByTestId('image');
    fireEvent(image, new Event('load'));
    expect(getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('should render successfully the loading variation', () => {
    const { getByTestId } = renderComponent(defaultProps);
    expect(getByTestId('image')).toHaveStyle('display: none');
    expect(getByTestId('cf-ui-skeleton-form')).toBeInTheDocument();
  });

  it('should render successfully the error variation', () => {
    const { getByTestId } = renderComponent({ ...defaultProps, isSelected: true });
    const image = getByTestId('image');
    fireEvent(image, new Event('error'));
    expect(image).toHaveStyle('display: none');
  });
});
