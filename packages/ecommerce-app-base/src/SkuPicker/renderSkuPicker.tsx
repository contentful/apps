import * as React from 'react';
import { DialogAppSDK } from '@contentful/app-sdk';
import { createRoot } from 'react-dom/client';
import { SkuPicker } from './SkuPicker';
import {
  MakeSaveBtnTextFn,
  MakeSearchPlaceholderText,
  MakeSearchHelpText,
  ProductPreviewsFn,
  ProductsFn,
} from '../types';

interface Props<> {
  sdk: DialogAppSDK;
  fetchProductPreviews: ProductPreviewsFn;
  fetchProducts: ProductsFn;
  searchDelay?: number;
  skuType?: string;
  makeSaveBtnText?: MakeSaveBtnTextFn;
  makeSearchPlaceholderText?: MakeSearchPlaceholderText;
  makeSearchHelpText?: MakeSearchHelpText;
  hideSearch?: boolean;
  showSearchBySkuOption?: boolean;
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
    makeSearchPlaceholderText,
    makeSearchHelpText,
    hideSearch,
    showSearchBySkuOption,
  }: Props
): void {
  const container = document.getElementById(elementId);
  const root = createRoot(container!);

  root.render(
    <SkuPicker
      sdk={sdk}
      fetchProductPreviews={fetchProductPreviews}
      fetchProducts={fetchProducts}
      searchDelay={searchDelay}
      skuType={skuType}
      makeSaveBtnText={makeSaveBtnText}
      makeSearchPlaceholderText={makeSearchPlaceholderText}
      makeSearchHelpText={makeSearchHelpText}
      hideSearch={hideSearch}
      showSearchBySkuOption={showSearchBySkuOption}
    />
  );
}
