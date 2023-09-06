import { DialogAppSDK } from '@contentful/app-sdk';
import { ProductPreviewsFn, renderSkuPicker } from '@contentful/ecommerce-app-base';
import { createResolver, fetchPreviews } from './api';
import { SkuType } from './types';

function makeSaveBtnText(skuType: SkuType) {
  if (skuType === 'product') {
    return (selectedSKUs: string[]) => {
      switch (selectedSKUs.length) {
        case 0:
          return 'Save products';
        case 1:
          return 'Save 1 product';
        default:
          return `Save ${selectedSKUs.length} products`;
      }
    };
  }

  if (skuType === 'category') {
    return (selectedSKUs: string[]) => {
      switch (selectedSKUs.length) {
        case 0:
          return 'Save categories';
        case 1:
          return 'Save 1 category';
        default:
          return `Save ${selectedSKUs.length} categories`;
      }
    };
  }
}

export async function renderDialog(sdk: DialogAppSDK) {
  const DIALOG_ID = 'dialog-root';

  const container = document.createElement('div');
  container.id = DIALOG_ID;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  document.body.appendChild(container);

  // @ts-expect-error
  const skuType = sdk.parameters?.invocation?.skuType as SkuType;

  renderSkuPicker(DIALOG_ID, {
    sdk,
    fetchProductPreviews: fetchPreviews as ProductPreviewsFn,
    fetchProducts: createResolver(sdk, skuType),
    searchDelay: 750,
    skuType,
    makeSaveBtnText: makeSaveBtnText(skuType),
    hideSearch: skuType === 'category',
  });

  sdk.window.startAutoResizer();
}
