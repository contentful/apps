import { FieldAppSDK, init } from '@contentful/app-sdk';
import { Integration, setup } from '@contentful/ecommerce-app-base';
import { fetchPreviews } from './api';
import { PARAMETER_DEFINITIONS, validateParameters } from './config';
import { SKU_TYPES } from './constants';
import { renderDialog } from './dialog';
import logo from './logo.svg';
import { CommerceToolsProduct, ConfigurationParameters } from './types';
import { AdditionalDataRenderer } from './additionalDataRenderer';

function makeCTA(fieldType: string, skuType?: string) {
  const isArray = fieldType === 'Array';
  if (skuType === 'category') {
    return `Select ${isArray ? 'categories' : 'a category'}`;
  } else {
    return `Select ${isArray ? 'products' : 'a product'}`;
  }
}

async function openDialog(
  sdk: FieldAppSDK,
  _currentValue: string | string[],
  config: ConfigurationParameters & {
    fieldValue?: string | string[];
    fieldType?: string;
    skuType?: string;
  }
) {
  const skus = await sdk.dialogs.openCurrentApp({
    allowHeightOverflow: true,
    position: 'center',
    title: makeCTA(sdk.field.type, config.skuType),
    shouldCloseOnOverlayClick: true,
    shouldCloseOnEscapePress: true,
    parameters: config as any,
    width: 1400,
  });

  return Array.isArray(skus) ? skus : [];
}

const integration: Integration<CommerceToolsProduct> = {
  makeCTA,
  name: 'commercetools',
  logo,
  color: '#213c45',
  description:
    'The commercetools app allows editors to select products from their commercetools account and reference them inside of Contentful entries.',
  parameterDefinitions: PARAMETER_DEFINITIONS,
  skuTypes: SKU_TYPES,
  validateParameters,
  fetchProductPreviews: fetchPreviews,
  renderDialog,
  isDisabled: () => false,
  openDialog,
  isInOrchestrationEAP: true,
  productCardVersion: 'v2',
  additionalDataRenderer: AdditionalDataRenderer,
};

init((sdk) => {
  // In the initial version of the app `fieldsConfig` was used.
  // Ecommerce app base stores the same information in `skuTypes`
  // To avoid breaking changes we need to migrate the parameters on-the-fly
  sdk.parameters.installation.skuTypes =
    sdk.parameters.installation.skuTypes ?? sdk.parameters.installation.fieldsConfig;

  setup(integration);
});
