import { mockCma } from '@__mocks__/mockCma';
import { makeSdkMock } from '@__mocks__/mockSdk';
import { fetchProductPreviews } from '@api/fetchProductPreviews';
import Field from '@components/Field/Field';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { vi } from 'vitest';

const sdk = makeSdkMock();

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

describe('Field Component', () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('should render without crashing', () => {
    const { container } = render(<Field />);
    expect(container).toMatchSnapshot();
  });

  it('should start auto resizer on mount', () => {
    render(<Field />);
    expect(sdk.window.startAutoResizer).toHaveBeenCalled();
  });

  it('should update value on sdk.field.onValueChanged', () => {
    const { queryByAltText } = render(<Field />);
    const newValue = ['sku1', 'sku2'];

    sdk.field.onValueChanged.mock.calls[0][0](newValue);

    expect(queryByAltText('Logo')).toBeInTheDocument();
    expect(sdk.field.getValue).toHaveBeenCalled();
  });

  it('should fetch product previews and call setValue correctly', () => {
    const { container } = render(<Field />);
    const skus = ['sku1', 'sku2'];

    const sortableComponent = container.querySelector('.sortable');
    if (sortableComponent) {
      fireEvent.change(sortableComponent, { target: { value: skus } });

      expect(fetchProductPreviews).toHaveBeenCalledWith(skus, sdk.parameters);
    }
  });

  it('should update value on sdk.field.setValue', () => {
    const { container } = render(<Field />);
    const skus = ['sku1', 'sku2'];

    const sortableComponent = container.querySelector('.sortable');
    if (sortableComponent) {
      fireEvent.change(sortableComponent, { target: { value: skus } });

      expect(sdk.field.setValue).toHaveBeenCalledWith(skus);
    }
  });

  it('should remove value on sdk.field.removeValue', () => {
    const { container } = render(<Field />);
    const skus: any = [];

    const sortableComponent = container.querySelector('.sortable');
    if (sortableComponent) {
      fireEvent.change(sortableComponent, { target: { value: skus } });

      expect(sdk.field.removeValue).toHaveBeenCalled();
    }
  });

  it('should call sdk.field.onIsDisabledChanged', () => {
    render(<Field />);
    expect(sdk.field.onIsDisabledChanged).toHaveBeenCalled();
  });
});
