import pick from 'lodash/pick';
import { setup } from '@contentful/dam-app-base';

import logo from './logo.svg';

const CTA = 'Select a file on Bynder';

const FIELDS_TO_PERSIST = [
  'archive',
  'brandId',
  'copyright',
  'dateCreated',
  'dateModified',
  'datePublished',
  'description',
  'extension',
  'fileSize',
  'height',
  'id',
  'isPublic',
  'limited',
  'name',
  'orientation',
  'original',
  'thumbnails',
  'type',
  'watermarked',
  'width',
  "videoPreviewURLs"
];

const FIELD_SELECTION = `
databaseId
type
orientation
description
isArchived
fileSize
height
width
copyright
extensions
createdBy
isWatermarked
isLimitedUse
isPublic
brandId
name
publishedAt
updatedAt
createdAt
files
`;

const validAssetTypes = ['image', 'audio', 'document', 'video'];

function makeThumbnail(resource) {
  const thumbnail = (resource.thumbnails && resource.thumbnails.webimage) || resource.src;
  const url = typeof thumbnail === 'string' ? thumbnail : undefined;
  const alt = [resource.id, ...(resource.tags || [])].join(', ');

  return [url, alt];
}

function prepareBynderHTML({ bynderURL, assetTypes }) {
  return `
    <div class="dialog-container">
      <div id="bynder-compactview" />
    </div>      
  `;
}

function transformAsset(asset) {
  return ({
    "id": asset.databaseId,
    "orientation": asset.orientation.toLowerCase(),
    "archive": asset.isArchived ? 1 : 0,
    "type": asset.type.toLowerCase(),
    "fileSize": asset.fileSize,
    "description": asset.description,
    "name": asset.name,
    "height": asset.height,
    "width": asset.width,
    "copyright": asset.copyright,
    "extension": asset.extensions,
    "userCreated": asset.createdBy,
    "datePublished": asset.publishedAt,
    "dateCreated": asset.createdAt,
    "dateModified": asset.updatedAt,
    "watermarked": asset.isWatermarked ? 1 : 0,
    "limited": asset.isLimitedUse ? 1 : 0,
    "isPublic": asset.isPublic ? 1 : 0,
    "brandId": asset.brandId,
    "thumbnails": {
      "contentful": asset.files.contentful.url,
      "mini": asset.files.mini.url,
      "webimage": asset.files.webImage.url,
      "thul": asset.files.thumbnail.url
    }
  })
}

function renderDialog(sdk) {
  const config = sdk.parameters.invocation;
  const { assetTypes, bynderURL } = config

  let types = [];
  if (!assetTypes) {
    // We deault to just images in this fallback since this is the behavior the App had in its initial release
    types = ['IMAGE'];
  } else {
    types = assetTypes.trim().split(',').map((type) => type.toUpperCase());
  }

  const container = document.createElement('div');
  container.innerHTML = prepareBynderHTML(config);
  document.body.appendChild(container);

  sdk.window.startAutoResizer();

  function onSuccess(assets, selected) {
    sdk.close(Array.isArray(assets) ? assets.map(transformAsset) : []);
  }

  window.addEventListener("message", (e) => {
    if (e.origin === 'https://app.contentful.com') {
      e.stopImmediatePropagation()
    }
  })


  BynderCompactView.open({
    language: "en_US",
    mode: "MultiSelect",
    assetTypes: types,
    portal: { url: bynderURL, editable: true },
    assetFieldSelection: FIELD_SELECTION,
    container: document.getElementById("bynder-compactview"),
    onSuccess: onSuccess
  });
}

async function openDialog(sdk, _currentValue, config) {
  const result = await sdk.dialogs.openCurrentApp({
    position: 'center',
    title: CTA,
    shouldCloseOnOverlayClick: true,
    shouldCloseOnEscapePress: true,
    parameters: { ...config },
    width: 1400
  });

  if (!Array.isArray(result)) {
    return [];
  }

  return result.map(item => ({
    ...pick(item, FIELDS_TO_PERSIST),
    src: item.thumbnails && item.thumbnails.webimage
  }));
}

function isDisabled() {
  return false;
}

function validateParameters({ bynderURL, assetTypes }) {
  const hasValidProtocol = bynderURL.startsWith('https://');
  const isHTMLSafe = ['"', '<', '>'].every(unsafe => !bynderURL.includes(unsafe));

  if (!hasValidProtocol || !isHTMLSafe) {
    return 'Provide a valid Bynder URL.';
  }

  const types = assetTypes.trim().split(',').map(type => type.trim());
  const isAssetTypesValid = types.every(type => validAssetTypes.includes(type));

  if (!isAssetTypesValid) {
    return `Only valid asset types may be selected: ${validAssetTypes.join(',')}`
  }

  return null;
}

setup({
  cta: CTA,
  name: 'Bynder',
  logo,
  color: '#0af',
  description:
    'The Bynder app is a widget that allows editors to select media from their Bynder account. Select or upload a file on Bynder and designate the assets that you want your entry to reference.',
  parameterDefinitions: [
    {
      "id": "bynderURL",
      "type": "Symbol",
      "name": "Bynder URL",
      "description": "Provide Bynder URL of your account.",
      "required": true
    },
    {
      "id": "assetTypes",
      "type": "Symbol",
      "name": "Asset types",
      "description": "Choose which types of assets can be selected.",
      "default": validAssetTypes.join(','),
      "required": true
    }
  ],
  makeThumbnail,
  renderDialog,
  openDialog,
  isDisabled,
  validateParameters
});
