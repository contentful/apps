import { render, cleanup } from '@testing-library/react';
import { Props, SortableList } from './SortableList';
import { productsList } from '../__mocks__';
import React from 'react';
import { vi } from 'vitest';

const defaultProps: Props = {
  disabled: false,
  productPreviews: productsList,
  deleteFn: vi.fn(),
};

const renderComponent = (props: Props) => {
  return render(<SortableList {...props} />);
};

describe('SortableList', () => {
  afterEach(cleanup);

  it('should render successfully', async () => {
    const { queryAllByTestId } = renderComponent(defaultProps);

    expect(queryAllByTestId('sortable-list-item')).toHaveLength(productsList.length);
  });
});
