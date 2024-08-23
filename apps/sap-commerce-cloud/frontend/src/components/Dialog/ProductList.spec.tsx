import { render, screen } from '@testing-library/react';
import { ProductList } from './ProductList';
import { vi } from 'vitest';
import { DialogAppSDK } from '@contentful/app-sdk';
import { makeSdkMock } from '../../__mocks__';

describe('ProductList', () => {
  it('renders', () => {
    const { container } = render(
      <ProductList
        {...{
          sdk: makeSdkMock() as unknown as DialogAppSDK,
          products: [],
          selectedProducts: [],
          baseSite: '',
          checkboxFn: vi.fn(),
        }}
      />
    );
    expect(container).toMatchSnapshot();
  });
  it('selectButtonClickEvent', async () => {
    const close = vi.fn();
    render(
      <ProductList
        {...{
          sdk: {
            ...makeSdkMock(),
            parameters: {
              invocation: {
                fieldType: 'Symbol',
              },
            },
            close,
          } as unknown as DialogAppSDK,
          products: [{ sku: '123', image: '', id: '', name: '', productUrl: '' }],
          selectedProducts: [],
          baseSite: '',
          checkboxFn: vi.fn(),
        }}
      />
    );
    const selectButton = await screen.findByLabelText('Select product');
    selectButton.click();
    expect(close).toHaveBeenCalled();
  });
});
