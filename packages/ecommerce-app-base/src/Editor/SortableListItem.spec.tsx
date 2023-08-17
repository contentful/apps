import * as React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { SortableListItem } from './SortableListItem';
import { productsList } from '../__mocks__';
import { Props } from '../ProductCard/LegacyProductCard/LegacyProductCard';

const defaultProps: Props = {
  product: productsList[0],
  disabled: false,
  onDelete: jest.fn(),
  isSortable: false,
};

const renderComponent = (props: Props) => {
  return render(<SortableListItem index={0} {...props} />);
};

jest.mock('react-sortable-hoc', () => ({
  SortableContainer: (x: unknown) => x,
  SortableElement: (x: unknown) => x,
  SortableHandle: (x: unknown) => x,
}));

describe('SortableListItem', () => {
  afterEach(cleanup);

  it('should render successfully', async () => {
    const { getByTestId } = renderComponent(defaultProps);
    const image = getByTestId('image');
    fireEvent(image, new Event('load'));
    expect(image).toHaveStyle('display: block');
  });

  it('should render successfully the sortable variation', () => {
    const { getByTestId } = renderComponent({ ...defaultProps, isSortable: true });
    const image = getByTestId('image');
    fireEvent(image, new Event('load'));
    expect(image).toHaveStyle('display: block');
  });

  it('should render successfully the loading variation', () => {
    const { getByTestId } = renderComponent(defaultProps);
    const image = getByTestId('image');
    expect(image).toHaveStyle('display: none');
  });

  it('should render successfully the error variation for missing image', async () => {
    const { getByTestId } = renderComponent({ ...defaultProps, isSortable: true });
    const image = getByTestId('image');
    fireEvent(image, new Event('error'));
    expect(image).not.toBeInTheDocument();
    expect(getByTestId('asset-icon')).toBeInTheDocument();
  });

  it('should render successfully the error variation for missing product', async () => {
    const { getByTestId } = renderComponent({
      ...defaultProps,
      product: { ...productsList[0], name: '' },
    });
    const image = getByTestId('image');
    fireEvent(image, new Event('error'));
    expect(image).not.toBeInTheDocument();
    expect(getByTestId('error-circle-icon')).toBeInTheDocument();
  });
});
