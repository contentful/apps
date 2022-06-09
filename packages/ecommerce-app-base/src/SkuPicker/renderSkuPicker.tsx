import React from 'react';
import { DialogExtensionSDK } from '@contentful/app-sdk';
import { render } from 'react-dom';
import { SkuPicker } from './SkuPicker';
import { MakeSaveBtnTextFn, ProductPreviewsFn, ProductsFn } from '../interfaces';

interface Props {
  sdk: DialogExtensionSDK;
  fetchProductPreviews: ProductPreviewsFn;
  fetchProducts: ProductsFn;
  searchDelay?: number;
  skuType?: string;
  makeSaveBtnText?: MakeSaveBtnTextFn;
  hideSearch?: boolean;
}

export function renderSkuPicker(
  elementId: string,
  {
    sdk,
    fetchProductPreviews,
    fetchProducts,
    searchDelay,
    skuType,
    makeSaveBtnText,
    hideSearch,
  }: Props
): void {
  const root = document.getElementById(elementId);

  render(
    <SkuPicker
      sdk={sdk}
      fetchProductPreviews={fetchProductPreviews}
      fetchProducts={fetchProducts}
      searchDelay={searchDelay}
      skuType={skuType}
      makeSaveBtnText={makeSaveBtnText}
      hideSearch={hideSearch}
    />,
    root
  );
}
