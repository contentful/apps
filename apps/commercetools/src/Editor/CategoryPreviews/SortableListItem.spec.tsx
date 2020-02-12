import React from 'react';
import identity from 'lodash/identity';
import { configure, render, cleanup } from '@testing-library/react';
import { Props, SortableListItem } from './SortableListItem';
import categoryPreviews from '../../__mocks__/categoryPreviews';

configure({
  testIdAttribute: 'data-test-id'
});

const defaultProps: Props = {
  category: categoryPreviews[0],
  disabled: false,
  onDelete: jest.fn(),
  isSortable: false
};

const renderComponent = (props: Props) => {
  return render(<SortableListItem index={0} {...props} />);
};

jest.mock('react-sortable-hoc', () => ({
  SortableContainer: identity,
  SortableElement: identity,
  SortableHandle: identity
}));

describe('SortableListItem', () => {
  afterEach(cleanup);

  it('should render successfully', async () => {
    const component = renderComponent(defaultProps);
    expect(component.container).toMatchSnapshot();
  });

  it('should render successfully the error variation for missing slug', () => {
    const component = renderComponent({
      ...defaultProps,
      category: { ...categoryPreviews[0], name: '' }
    });
    expect(component.container).toMatchSnapshot();
  });
});
