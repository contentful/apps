import { configure, render, cleanup } from '@testing-library/react';
import { Props, SortableListItem } from './SortableListItem';
import { mockCategoryPreview } from '../../__mocks__/mockCategoryPreview';

configure({
  testIdAttribute: 'data-test-id',
});

const defaultProps: Props = {
  category: mockCategoryPreview,
  disabled: false,
  onDelete: jest.fn(),
  isSortable: false,
};

jest.mock('react-sortable-hoc');

const renderComponent = (props: Props) => {
  return render(<SortableListItem index={0} {...props} />);
};

describe.skip('SortableListItem', () => {
  afterEach(cleanup);

  it('should render successfully', async () => {
    const component = renderComponent(defaultProps);
    expect(component.container).toMatchSnapshot();
  });

  it('should render successfully the error variation for missing slug', () => {
    const component = renderComponent({
      ...defaultProps,
      category: { ...mockCategoryPreview, name: '' },
    });
    expect(component.container).toMatchSnapshot();
  });
});
