import { DialogExtensionSDK, FieldExtensionSDK } from 'contentful-ui-extensions-sdk';
import { setup, renderSkuPicker } from 'shared-sku-app';
import { dialogConfig, DIALOG_ID, SKUPickerConfig, strings } from './constants';

import PaginatedFetcher from './PaginatedFetcher';
import { ClientConfig, Identifiers } from './types';

const makeCTA = (fieldType: string) => {
  return fieldType === 'Array' ? strings.selectProducts : strings.selectProduct;
};

const validateParameters = (parameters: ClientConfig): string | null => {
  if (parameters.apiEndpoint.length < 1) {
    return 'Missing API Endpoint';
  }

  return null;
};

const createContainer = () => {
  const container = document.createElement('div');
  container.id = DIALOG_ID;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  document.body.appendChild(container);
};

const renderDialog = async (sdk: DialogExtensionSDK) => {
  createContainer();
  const fetcher = new PaginatedFetcher(sdk.parameters.installation as ClientConfig);

  renderSkuPicker(DIALOG_ID, {
    sdk,
    fetchProductPreviews: fetcher.getProductsAndVariantsByIdOrSKU,
    fetchProducts: fetcher.getVariantsWithProducts,
  });

  sdk.window.startAutoResizer();
};

const openDialog = async (sdk: FieldExtensionSDK, currentValue: any, parameters: ClientConfig) => {
  const skus = await sdk.dialogs.openCurrentApp({
    title: makeCTA(sdk.field.type),
    parameters,
    ...dialogConfig,
  });

  return Array.isArray(skus) ? skus : [];
};

const fetchProductPreviews = (identifiers: Identifiers, config: ClientConfig) =>
  new PaginatedFetcher(config).getProductsAndVariantsByIdOrSKU(identifiers);

const config = {
  ...SKUPickerConfig,
  makeCTA,
  isDisabled: () => false,
  fetchProductPreviews,
  renderDialog,
  openDialog,
  validateParameters,
};

// @ts-ignore in order to keep ClientConfig type instead of sku apps' Record<string, string>
setup(config);
