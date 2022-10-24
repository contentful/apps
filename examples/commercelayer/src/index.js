import CLayerAuth from '@commercelayer/js-auth';
import difference from 'lodash/difference';
import chunk from 'lodash/chunk';
import flatMap from 'lodash/flatMap';

import { setup, renderSkuPicker } from '@contentful/ecommerce-app-base';

import logo from './logo.svg';
import { dataTransformer } from './dataTransformer';

const DIALOG_ID = 'root';
const PER_PAGE = 20;

let accessToken = null;

function makeCTA(fieldType) {
  return fieldType === 'Array' ? 'Select products' : 'Select a product';
}

function validateParameters(parameters) {
  if (parameters.clientId.length < 1) {
    return 'Provide your Sales Channel client ID.';
  }

  if (parameters.apiEndpoint.length < 1 || !parameters.apiEndpoint.startsWith('https://')) {
    return 'Provide a valid Sales Channel API endpoint.';
  }

  if (
    parameters.scope.length > 1 &&
    !parameters.scope.startsWith('market:') &&
    !parameters.scope.startsWith('stock_location:')
  ) {
    return 'Provide a valid Sales Channel scope. Please ask your admin to update configuration.';
  }

  return null;
}

async function getAccessToken(clientId, endpoint, scope) {
  if (!accessToken) {
    /* eslint-disable-next-line require-atomic-updates */
    accessToken = (
      await CLayerAuth.getIntegrationToken({
        clientId,
        endpoint: endpoint.startsWith('https://') ? endpoint : `https://${endpoint}`,
        // The empty client secret is needed for legacy reasons, as the
        // CLayerAuth SDK will throw if not present. By setting to empty
        // string we prevent the SDK exception and the value is ignored
        // by the Commerce Layer Auth API.
        clientSecret: '',
        scope,
      })
    ).accessToken;
  }
  return accessToken;
}

/**
 * This function is needed to make the pagination of Commerce Layer work with the
 * @contentful/ecommerce-app-base library.
 *
 * When fetching the SKUs via the Commerce Layer JS SDK the metadata object which
 * includes the total count of records needed by the shared-sku-picker paginator
 * is missing. But it is there when fetching the SKUs via a plain HTTP req.
 */
async function fetchSKUs(installationParams, search, pagination) {
  const validationError = validateParameters(installationParams);
  if (validationError) {
    throw new Error(validationError);
  }

  const { clientId, apiEndpoint, scope } = installationParams;
  const accessToken = await getAccessToken(clientId, apiEndpoint, scope);

  const URL = `${apiEndpoint}/api/skus?page[size]=${PER_PAGE}&page[number]=${
    pagination.offset / PER_PAGE + 1
  }${search.length ? `&filter[q][name_or_code_cont]=${search}` : ''}`;

  const res = await fetch(URL, {
    headers: {
      Accept: 'application/vnd.api+json',
      Authorization: `Bearer ${accessToken}`,
    },
    method: 'GET',
  });

  return await res.json();
}

/**
 * Fetches the product previews for the products selected by the user.
 */
const fetchProductPreviews = async function fetchProductPreviews(skus, config) {
  if (!skus.length) {
    return [];
  }

  const PREVIEWS_PER_PAGE = 25;

  const { clientId, apiEndpoint, scope } = config;
  const accessToken = await getAccessToken(clientId, apiEndpoint, scope);

  // Commerce Layer's API automatically paginated results for collection endpoints.
  // Here we account for the edge case where the user has picked more than 25
  // products, which is the max amount of pagination results. We need to fetch
  // and compile the complete selection result doing 1 request per 25 items.
  const resultPromises = chunk(skus, PREVIEWS_PER_PAGE).map(async (skusSubset) => {
    const URL = `${apiEndpoint}/api/skus?page[size]=${PREVIEWS_PER_PAGE}&filter[q][code_in]=${skusSubset}`;
    const res = await fetch(URL, {
      headers: {
        Accept: 'application/vnd.api+json',
        Authorization: `Bearer ${accessToken}`,
      },
      method: 'GET',
    });
    return await res.json();
  });

  const results = await Promise.all(resultPromises);

  const foundProducts = flatMap(results, ({ data }) =>
    data.map(dataTransformer(config.apiEndpoint))
  );

  const missingProducts = difference(
    skus,
    foundProducts.map((product) => product.sku)
  ).map((sku) => ({ sku, isMissing: true, image: '', name: '', id: '' }));

  return [...foundProducts, ...missingProducts];
};

async function renderDialog(sdk) {
  const container = document.getElementById(DIALOG_ID);
  container.style.display = 'flex';
  container.style.flexDirection = 'column';

  renderSkuPicker(DIALOG_ID, {
    sdk,
    fetchProductPreviews,
    fetchProducts: async (search, pagination) => {
      const result = await fetchSKUs(sdk.parameters.installation, search, pagination);

      return {
        pagination: {
          count: PER_PAGE,
          limit: PER_PAGE,
          total: result.meta.record_count,
          offset: pagination.offset,
        },
        products: result.data.map(dataTransformer(sdk.parameters.installation.apiEndpoint)),
      };
    },
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
    width: 1400,
  });

  return Array.isArray(skus) ? skus : [];
}

function isDisabled(/* currentValue, config */) {
  // No restrictions need to be imposed as to when the field is disabled from the app's side
  return false;
}

setup({
  makeCTA,
  name: 'Commerce Layer',
  logo,
  description:
    'The Commerce Layer app allows editors to select products from their Commerce Layer account and reference them inside of Contentful entries.',
  color: '#212F3F',
  parameterDefinitions: [
    {
      id: 'clientId',
      name: 'Client ID',
      description: 'The client ID of your Sales Channel.',
      type: 'Symbol',
      required: true,
    },
    {
      id: 'apiEndpoint',
      name: 'API Endpoint',
      description: 'Sales Channel API endpoint (e.g., "https://acme.commercelayer.io")',
      type: 'Symbol',
      required: true,
    },
    {
      id: 'scope',
      name: 'Scope',
      description: 'Allowed scope for Sales Channel (e.g., "market:1234")',
      type: 'Symbol',
      required: false,
    },
  ],
  fetchProductPreviews,
  renderDialog,
  openDialog,
  isDisabled,
  validateParameters,
});
