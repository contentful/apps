import { setup, renderSkuPicker } from '@contentful/ecommerce-app-base';
import { fetchProductPreviews, makeProductSearchResolver } from './productResolvers';

import logo from './logo.svg';

const DIALOG_ID = 'dialog-root';

function makeCTA(fieldType) {
  return fieldType === 'Array' ? 'Select products' : 'Select a product';
}

export function validateParameters(parameters) {
  if (parameters.storefrontAccessToken.length < 1) {
    return 'Provide the storefront access token to your Shopify store.';
  }

  if (parameters.apiEndpoint.length < 1) {
    return 'Provide the Shopify API endpoint.';
  }

  return null;
}

async function renderDialog(sdk) {
  const container = document.createElement('div');
  container.id = DIALOG_ID;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  document.body.appendChild(container);

  renderSkuPicker(DIALOG_ID, {
    sdk,
    fetchProductPreviews,
    fetchProducts: await makeProductSearchResolver(sdk),
    searchDelay: 750
  });

  sdk.window.startAutoResizer();
}

async function openDialog(sdk, currentValue, config) {
  const skus = await sdk.dialogs.openCurrentApp({
    allowHeightOverflow: true,
    position: 'center',
    title: makeCTA(sdk.field.type),
    shouldCloseOnOverlayClick: true,
    shouldCloseOnEscapePress: true,
    parameters: config,
    width: 1400
  });

  return Array.isArray(skus) ? skus : [];
}

function isDisabled(/* currentValue, config */) {
  // No restrictions need to be imposed as to when the field is disabled from the app's side
  return false;
}

setup({
  makeCTA,
  name: 'Shopify',
  logo,
  description:
    'The Shopify app allows editors to select products from their Shopify account and reference them inside of Contentful entries.',
  color: '#212F3F',
  parameterDefinitions: [
    {
      id: 'storefrontAccessToken',
      name: 'Storefront Access Token',
      description: 'The storefront access token to your Shopify store',
      type: 'Symbol',
      required: true
    },
    {
      id: 'apiEndpoint',
      name: 'API Endpoint',
      description: 'The Shopify API endpoint',
      type: 'Symbol',
      required: true
    }
  ],
  fetchProductPreviews,
  renderDialog,
  openDialog,
  isDisabled,
  validateParameters
});
