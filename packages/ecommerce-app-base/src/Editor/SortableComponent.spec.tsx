import React from 'react';
import { render, cleanup, waitFor } from '@testing-library/react';
import { SortableComponent } from './SortableComponent';
import { makeSdkMock, productsList } from '../__mocks__';
import { FieldAppSDK } from '@contentful/app-sdk';
import { ProductPreviewsFn } from '../types';
import { vi } from 'vitest';

const mockSdk = makeSdkMock();
const skus = ['M0E20130820E90Z', 'A0E2300FX102203', 'M0E21300900DZN7'];
const mockConfig = {};
const mockSkuType = 'mock-sku-type';

describe('SortableComponent', () => {
  let mockFetchProductPreviews: ProductPreviewsFn;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - typescript is upset because vi.fn() returns a type different than ProductPreviewsFn
    mockFetchProductPreviews = vi.fn().mockImplementation(() => {
      return Promise.resolve(productsList);
    });
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it('calls `fetchProductPreviews()` to retrieve list of products for associated skus', async () => {
    waitFor(() => {
      render(
        <SortableComponent
          sdk={mockSdk as unknown as FieldAppSDK}
          disabled={false}
          config={mockConfig}
          skus={skus}
          onChange={vi.fn()}
          fetchProductPreviews={mockFetchProductPreviews}
          skuType={mockSkuType}
        />
      );
    });

    expect(mockFetchProductPreviews).toHaveBeenCalledTimes(1);
    expect(mockFetchProductPreviews).toHaveBeenLastCalledWith(skus, mockConfig, mockSkuType);
  });

  it('refetches list of products for associated skus, when skus are added/removed', async () => {
    const newSkus = [...skus, 'new-sku-item'];

    await waitFor(() => {
      // initial mount with original skus
      const { rerender } = render(
        <SortableComponent
          sdk={mockSdk as unknown as FieldAppSDK}
          disabled={false}
          config={mockConfig}
          skus={skus}
          onChange={vi.fn()}
          fetchProductPreviews={mockFetchProductPreviews}
          skuType={mockSkuType}
        />
      );

      // rerender with additional sku
      rerender(
        <SortableComponent
          skus={newSkus}
          sdk={mockSdk as unknown as FieldAppSDK}
          disabled={false}
          config={mockConfig}
          onChange={vi.fn()}
          fetchProductPreviews={mockFetchProductPreviews}
          skuType={mockSkuType}
        />
      );
    });

    expect(mockFetchProductPreviews).toHaveBeenCalledTimes(2);
    expect(mockFetchProductPreviews).toHaveBeenLastCalledWith(newSkus, mockConfig, mockSkuType);
  });

  it('does NOT refetch list of products when skus have simply been reordered', async () => {
    const reorderedSkus = [skus[1], skus[0], skus[2]];

    await waitFor(() => {
      // initial mount with original skus
      const { rerender } = render(
        <SortableComponent
          sdk={mockSdk as unknown as FieldAppSDK}
          disabled={false}
          config={mockConfig}
          skus={skus}
          onChange={vi.fn()}
          fetchProductPreviews={mockFetchProductPreviews}
          skuType={mockSkuType}
        />
      );

      // rerender with new skus, just reordered
      rerender(
        <SortableComponent
          skus={reorderedSkus}
          sdk={mockSdk as unknown as FieldAppSDK}
          disabled={false}
          config={mockConfig}
          onChange={vi.fn()}
          fetchProductPreviews={mockFetchProductPreviews}
          skuType={mockSkuType}
        />
      );

      expect(mockFetchProductPreviews).toHaveBeenCalledTimes(1);
    });
  });
});
