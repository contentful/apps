import React from 'react';
import { DialogExtensionSDK } from '@contentful/app-sdk';
import { render } from 'react-dom';
import { SkuPicker } from './SkuPicker';
import { ProductPreviewsFn, ProductsFn } from '../interfaces';

interface Props {
  sdk: DialogExtensionSDK;
  fetchProductPreviews: ProductPreviewsFn;
  fetchProducts: ProductsFn;
  searchDelay?: number;
  skuLabel?: string;
  readableIdentifierLabel?: string;
}

export function renderSkuPicker(
  elementId: string,
  { sdk, fetchProductPreviews, fetchProducts, searchDelay, skuLabel, readableIdentifierLabel }: Props
): void {
  const root = document.getElementById(elementId);
  render(
    <SkuPicker
      sdk={sdk}
      fetchProductPreviews={fetchProductPreviews}
      fetchProducts={fetchProducts}
      searchDelay={searchDelay}
      skuLabel={skuLabel}
      readableIdentifierLabel={readableIdentifierLabel}
    />,
    root
  );
}
