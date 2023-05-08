import { render, cleanup } from '@testing-library/react';
import { Props, SortableList } from './SortableList';
import { mockProductPreview } from '../../__mocks__/mockProductPreview';

const defaultProps: Props = {
  disabled: false,
  productPreviews: [mockProductPreview],
  deleteFn: jest.fn(),
};

const renderComponent = (props: Props) => {
  return render(<SortableList {...props} />);
};

describe('SortableList', () => {
  afterEach(cleanup);

  it('should render successfully', async () => {
    const component = renderComponent(defaultProps);
    expect(component.container).toMatchSnapshot();
  });
});
