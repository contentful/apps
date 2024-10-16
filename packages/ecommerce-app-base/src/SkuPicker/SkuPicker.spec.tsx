import * as React from 'react';
import { merge } from 'lodash';
import { fireEvent, configure, render, cleanup } from '@testing-library/react';
import { Props, SkuPicker } from './SkuPicker';
import { productsList } from '../__mocks__';
import { DialogAppSDK } from '@contentful/app-sdk';
import { Integration, ProductsFn } from '../types';
import { vi } from 'vitest';

configure({
  testIdAttribute: 'data-test-id',
});

const renderComponent = async (props: Props) => {
  const component = render(<SkuPicker {...props} />);
  // wait for data to load and render
  await component.findByText('Dress Twin-Set rose');
  component.getAllByTestId('image').forEach((img) => fireEvent(img, new Event('load')));
  return component;
};

describe('SkuPicker', () => {
  let defaultProps: Props;
  beforeEach(() => {
    defaultProps = {
      sdk: {
        parameters: {
          installation: {},
          invocation: {
            fieldType: 'Symbol',
            fieldValue: [],
          },
        },
        close: vi.fn(),
        notifier: {
          success: vi.fn(),
          error: vi.fn(),
        },
      } as unknown as DialogAppSDK,
      fetchProductPreviews: vi.fn((skus) =>
        productsList.filter((preview) => skus.includes(preview.sku))
      ) as unknown as Integration['fetchProductPreviews'],
      fetchProducts: vi.fn(() => ({
        pagination: {
          count: 3,
          limit: 20,
          offset: 0,
          total: 3,
        },
        products: productsList,
      })) as unknown as ProductsFn,
    };
  });
  afterEach(cleanup);

  it('should render basic search successfully with no products selected', async () => {
    const { getByTestId, queryByTestId } = await renderComponent(defaultProps);
    expect(getByTestId('sku-search')).toBeTruthy();
    expect(queryByTestId('search-by-sku')).not.toBeTruthy();
  });

  it('should not render search when hideSearch is true', async () => {
    const { queryByTestId } = await renderComponent({ ...defaultProps, hideSearch: true });
    expect(queryByTestId('sku-search')).not.toBeTruthy();
    expect(queryByTestId('search-by-sku')).not.toBeTruthy();
  });

  it('should render search by sku option if showSearchBySkuOption is true', async () => {
    const { getByTestId } = await renderComponent({ ...defaultProps, showSearchBySkuOption: true });
    expect(getByTestId('search-by-sku')).toBeTruthy();
  });

  it('should render custom placeholder text in search box when makeSearchPlaceholderText exists', async () => {
    const makeSearchPlaceholderText = vi.fn(() => 'My custom placeholder text');
    const { getByPlaceholderText } = await renderComponent({
      ...defaultProps,
      makeSearchPlaceholderText,
    });
    expect(getByPlaceholderText('My custom placeholder text')).toBeTruthy();
  });

  it('should render custom help text under search box when makeSearchHelpText exists', async () => {
    const makeSearchHelpText = vi.fn(() => 'My custom help text');
    const { getByText } = await renderComponent({
      ...defaultProps,
      makeSearchHelpText,
    });
    expect(getByText('My custom help text')).toBeTruthy();
  });

  describe('when it has infinite scrolling mode pagination', () => {
    it('should render the "Load more" text link if there is a next page', async () => {
      const { findByTestId } = await renderComponent({
        ...defaultProps,
        fetchProducts: vi.fn(() => ({
          pagination: {
            hasNextPage: true,
          },
          products: productsList.slice(0, 2),
        })) as unknown as ProductsFn,
      });
      expect(await findByTestId('infinite-scrolling-pagination')).toBeTruthy();
    });

    it('should not render the "Load more" text link if there is no next page', async () => {
      const { queryByTestId } = await renderComponent({
        ...defaultProps,
        fetchProducts: vi.fn(() => ({
          pagination: {
            hasNextPage: false,
          },
          products: productsList.slice(0, 2),
        })) as unknown as ProductsFn,
      });
      expect(queryByTestId('infinite-scrolling-pagination')).toBeNull();
    });
  });

  describe('when it is operating on a field of type Symbol', () => {
    it('should allow the user to select only one product', async () => {
      const { queryByTestId, findByTestId } = await renderComponent(defaultProps);
      const productA = await findByTestId(`product-preview-${productsList[1].sku}`);
      const productB = await findByTestId(`product-preview-${productsList[2].sku}`);
      productA.click();
      productB.click();
      expect(queryByTestId(`selection-preview-${productsList[1].sku}`)).toBeNull();
      expect(await findByTestId(`selection-preview-${productsList[2].sku}`)).toBeTruthy();
    });
  });

  describe('when it is operating on a field of type Symbol[]', () => {
    it('should allow the user to select multiple products', async () => {
      const { findByTestId } = await renderComponent({
        ...defaultProps,
        sdk: merge({}, defaultProps.sdk, {
          parameters: { invocation: { fieldType: 'Array' } },
        }),
      });
      const productA = await findByTestId(`product-preview-${productsList[1].sku}`);
      const productB = await findByTestId(`product-preview-${productsList[2].sku}`);
      productA.click();
      productB.click();
      expect(await findByTestId(`selection-preview-${productsList[1].sku}`)).toBeTruthy();
      expect(await findByTestId(`selection-preview-${productsList[2].sku}`)).toBeTruthy();
    });
  });
});
