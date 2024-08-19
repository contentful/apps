import { render, screen } from '@testing-library/react';
import { ProductList } from './ProductList';
import { vi } from 'vitest';
import { DialogExtensionSDK } from '@contentful/app-sdk';
import { makeSdkMock } from '../../__mocks__';

describe('ProductList', () => {
  it('renders', () => {
    const { container } = render(
      <ProductList
        {...{
          sdk: makeSdkMock() as unknown as DialogExtensionSDK,
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
          } as unknown as DialogExtensionSDK,
          products: [{ sku: '123', image: '', id: '', name: '', productUrl: '' }],
          selectedProducts: [],
          baseSite: '',
          checkboxFn: vi.fn(),
        }}
      />
    );
    const selectButton = await screen.findByLabelText('Select');
    selectButton.click();
    expect(close).toHaveBeenCalled();
  });
});
