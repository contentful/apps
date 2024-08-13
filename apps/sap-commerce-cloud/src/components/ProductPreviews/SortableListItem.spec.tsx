import { cleanup, fireEvent, render } from '@testing-library/react';
import { SortableListItem } from './SortableListItem';
import { mockProductPreview } from '../../__mocks__';
import { Props } from './SortableListItem';

const defaultProps: Props = {
  product: mockProductPreview,
  disabled: false,
  onDelete: jest.fn(),
  isSortable: false,
};

const renderComponent = (props: Props) => {
  return render(<SortableListItem {...props} />);
};

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
    expect(getByTestId('icon')).toBeInTheDocument();
  });
});
