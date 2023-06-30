import { render, cleanup } from '@testing-library/react';
import { Props, SortableList } from './SortableList';
import { mockCategoryPreview } from '../../__mocks__/mockCategoryPreview';

const defaultProps: Props = {
  disabled: false,
  categoryPreviews: [mockCategoryPreview],
  deleteFn: jest.fn(),
};

const renderComponent = (props: Props) => {
  return render(<SortableList {...props} />);
};

describe.skip('SortableList', () => {
  afterEach(cleanup);

  it('should render successfully', async () => {
    const component = renderComponent(defaultProps);
    expect(component.container).toMatchSnapshot();
  });
});
