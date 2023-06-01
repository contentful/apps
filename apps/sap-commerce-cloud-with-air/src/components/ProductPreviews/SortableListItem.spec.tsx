import React from 'react';
import identity from 'lodash/identity';
import { fireEvent, configure, render, cleanup } from '@testing-library/react';
import { Props, SortableListItem } from './SortableListItem';
import { mockProductPreview } from '../../__mocks__/mockProductPreview';

configure({
  testIdAttribute: 'data-test-id',
});

const defaultProps: Props = {
  product: mockProductPreview,
  disabled: false,
  onDelete: jest.fn(),
  isSortable: false,
};

const renderComponent = (props: Props) => {
  return render(<SortableListItem index={0} {...props} />);
};

jest.mock('react-sortable-hoc');

describe('SortableListItem', () => {
  afterEach(cleanup);

  it('should render successfully', async () => {
    const component = renderComponent(defaultProps);
    fireEvent(component.getByTestId('image'), new Event('load'));
    expect(component.container).toMatchSnapshot();
  });

  it('should render successfully the sortable variation', () => {
    const component = renderComponent({ ...defaultProps, isSortable: true });
    fireEvent(component.getByTestId('image'), new Event('load'));
    expect(component.container).toMatchSnapshot();
  });

  it('should render successfully the loading variation', () => {
    const component = renderComponent(defaultProps);
    expect(component.container).toMatchSnapshot();
  });

  it('should render successfully the error variation for missing image', () => {
    const component = renderComponent({ ...defaultProps, isSortable: true });
    fireEvent(component.getByTestId('image'), new Event('error'));
    expect(component.container).toMatchSnapshot();
  });

  it('should render successfully the error variation for missing product', () => {
    const component = renderComponent({
      ...defaultProps,
      product: { ...mockProductPreview, name: '' },
    });
    fireEvent(component.getByTestId('image'), new Event('error'));
    expect(component.container).toMatchSnapshot();
  });
});
