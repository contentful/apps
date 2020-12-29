import pick from 'lodash/pick';

import { setup } from 'shared-dam-app';

import logo from './logo.png';

const CTA = 'Import from Adobe Experience Manager';
const IMPORTER_MODES = {
  single: 'single',
  multiple: 'multiple',
};
const TYPES_OF_ASSET = {
  any: 'any',
  images: 'images',
  documents: 'documents',
  multimedia: 'multimedia',
  archives: 'archives',
};
const FIELDS_TO_PERSIST = ['url', 'type', 'title', 'size', 'img'];
const IFRAME_ACTIONS = {
  success: 200,
  cancel: 500,
};

function makeThumbnail(resource, config) {
  return [resource.img, resource.title];
}

function prepareHTML(iframeURL) {
  return `<iframe title="Adobe Experience Manager" src=${iframeURL} class="aem-iframe"></iframe>`;
}

function listenForMessage(event, sdk) {
  const res = typeof event.data === 'string' && JSON.parse(event.data);
  if (res.config) {
    if (res.config.action === 'close') {
      sdk.close({ action: IFRAME_ACTIONS.cancel, data: {} });
    } else {
      sdk.close({ action: IFRAME_ACTIONS.success, data: res.data });
    }
  }
}

function buildIframeUrl(domain, mode, rootPath, assetType) {
  const baseUrl = `https://${domain}/aem/assetpicker.html?mode=${mode}`;
  const filters = [];
  if (rootPath && rootPath !== '/') {
    filters.push({ key: 'root', value: rootPath });
  }
  if (assetType !== TYPES_OF_ASSET.any) {
    filters.push({ key: 'assettype', value: assetType });
  }

  if (filters.length) {
    return `${baseUrl}&${filters.map(f => `${f.key}=${f.value}`).join('&')}`;
  }

  return baseUrl;
}

function renderDialog(sdk) {
  const { configDomain, rootPath } = sdk.parameters.installation;
  const { mode, assetType } = sdk.parameters.invocation;

  const container = document.createElement('div');
  container.classList = 'aem-iframe-container';
  const iframe = prepareHTML(
    buildIframeUrl(configDomain, mode, rootPath, assetType)
  );
  container.innerHTML = prepareHTML(
    buildIframeUrl(configDomain, mode, rootPath, assetType)
  );

  // Add iframe to dialog
  document.body.appendChild(container);
  sdk.window.startAutoResizer();

  // Ensure we listen to the interaction with the iframe
  window.addEventListener('message', e => listenForMessage(e, sdk));
}

async function openDialog(sdk, currentValue = [], config) {
  const { mode, assetType } = config;
  const result = await sdk.dialogs.openCurrentApp({
    position: 'center',
    title: CTA,
    shouldCloseOnOverlayClick: true,
    shouldCloseOnEscapePress: true,
    minHeight: '80vh',
    allowHeightOverflow: true,
    width: 'fullWidth',
    parameters: { mode, assetType },
  });

  if (result && result.action === IFRAME_ACTIONS.success) {
    return result.data.map(asset => pick(asset, FIELDS_TO_PERSIST));
  } else {
    return [];
  }
}

function isDisabled(currentValue, config) {
  return (
    (currentValue.length && config.mode === IMPORTER_MODES.single) || false
  );
}

function validateParameters(parameters) {
  if (parameters.configDomain.length < 1) {
    return 'Provide your Adobe Experience Manager domain name.';
  }

  if (
    !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/.test(
      parameters.configDomain
    )
  ) {
    return 'Please enter a valid AEM domain name.';
  }

  if (
    !/^(\/)([a-z0-9]+(?:-[a-z0-9]+)*)?(\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(
      parameters.rootPath
    )
  ) {
    return 'Please enter a valid root path.';
  }

  return null;
}

setup({
  cta: CTA,
  name: 'Adobe Experience Manager',
  logo,
  description:
    'The Adobe Experience Manager app allows editors to select media from their AEM account. Select the asset from AEM that you want your entry to reference.',
  color: '#ee732e',
  parameterDefinitions: [
    {
      id: 'configDomain',
      name: 'AEM domain',
      description:
        'The domain of your Adobe Experience Manager instance. Example: example.adobecqms.net',
      type: 'Symbol',
      required: true,
    },
    {
      id: 'rootPath',
      name: 'Root path',
      description:
        'The path within AEM to set as the navigaton start within the Asset Selector. Can be found in the URL bar after assets.html when navigating to a directory within AEM',
      type: 'Symbol',
    },
  ],
  makeThumbnail,
  renderDialog,
  openDialog,
  isDisabled,
  validateParameters,
});
