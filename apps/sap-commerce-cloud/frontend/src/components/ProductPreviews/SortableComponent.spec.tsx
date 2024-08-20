import { act, render, cleanup, waitFor } from '@testing-library/react';
import { SortableComponent } from './SortableComponent';
import { mockProductPreview, makeSdkMock } from '../../__mocks__';
import { FieldAppSDK } from '@contentful/app-sdk';
import { PreviewsFn } from '../../interfaces';
import { vi } from 'vitest';

const mockSdk = makeSdkMock();
const skus = ['/product/abc1234', '/product/ced5678', '/product/fgh9012'];

describe('SortableComponent', () => {
  let mockFetchProductPreviews: PreviewsFn;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - typescript is upset because jest.fn() returns a type different than ProductPreviewsFn
    mockFetchProductPreviews = vi.fn().mockImplementation(() => {
      return Promise.resolve([mockProductPreview]);
    });
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it('calls `fetchProductPreviews()` to retrieve list of products for associated skus', async () => {
    act(() => {
      render(
        <SortableComponent
          sdk={mockSdk as unknown as FieldAppSDK}
          disabled={false}
          skus={skus}
          onChange={vi.fn()}
          fetchProductPreviews={mockFetchProductPreviews}
        />
      );
    });

    await waitFor(() => expect(mockFetchProductPreviews).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockFetchProductPreviews).toHaveBeenLastCalledWith(skus));
  });

  it('refetches list of products for associated skus, when skus are added/removed', async () => {
    const newSkus = [...skus, 'new-sku-item'];

    act(() => {
      // initial mount with original skus
      const { rerender } = render(
        <SortableComponent
          sdk={mockSdk as unknown as FieldAppSDK}
          disabled={false}
          skus={skus}
          onChange={vi.fn()}
          fetchProductPreviews={mockFetchProductPreviews}
        />
      );

      // rerender with additional sku
      rerender(
        <SortableComponent
          skus={newSkus}
          sdk={mockSdk as unknown as FieldAppSDK}
          disabled={false}
          onChange={vi.fn()}
          fetchProductPreviews={mockFetchProductPreviews}
        />
      );
    });

    await waitFor(() => expect(mockFetchProductPreviews).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(mockFetchProductPreviews).toHaveBeenLastCalledWith(newSkus));
  });

  it('does NOT refetch list of products when skus have simply been reordered', async () => {
    const reorderedSkus = [skus[1], skus[0], skus[2]];

    act(() => {
      // initial mount with original skus
      const { rerender } = render(
        <SortableComponent
          sdk={mockSdk as unknown as FieldAppSDK}
          disabled={false}
          skus={skus}
          onChange={vi.fn()}
          fetchProductPreviews={mockFetchProductPreviews}
        />
      );

      // rerender with new skus, just reordered
      rerender(
        <SortableComponent
          skus={reorderedSkus}
          sdk={mockSdk as unknown as FieldAppSDK}
          disabled={false}
          onChange={vi.fn()}
          fetchProductPreviews={mockFetchProductPreviews}
        />
      );
    });

    await waitFor(() => expect(mockFetchProductPreviews).toHaveBeenCalledTimes(1));
  });
});
