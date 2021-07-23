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
}

export function renderSkuPicker(
  elementId: string,
  { sdk, fetchProductPreviews, fetchProducts, searchDelay }: Props
): void {
  const root = document.getElementById(elementId);
  render(
    <SkuPicker
      sdk={sdk}
      fetchProductPreviews={fetchProductPreviews}
      fetchProducts={fetchProducts}
      searchDelay={searchDelay}
    />,
    root
  );
}
