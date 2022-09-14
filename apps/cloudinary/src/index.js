import pick from 'lodash/pick';
import { Cloudinary as cloudinaryCore } from 'cloudinary-core';

import { setup } from '@contentful/dam-app-base';
import { loadScript } from './utils';

import logo from './logo.svg';

const MAX_FILES_UPPER_LIMIT = 25;
const CTA = 'Select or upload a file on Cloudinary';
const VALID_IMAGE_FORMATS = [
  'svg',
  'jpg',
  'png',
  'gif',
  'jpeg',
  'tiff',
  'ico',
  'webp',
  'pdf',
  'bmp',
  'psd',
  'eps',
  'jxr',
  'wdp',
];
const FIELDS_TO_PERSIST = [
  'url',
  'tags',
  'type',
  'bytes',
  'width',
  'format',
  'height',
  'version',
  'duration',
  'metadata',
  'context',
  'public_id',
  'created_at',
  'secure_url',
  'resource_type',
  'original_url',
  'original_secure_url',
  'raw_transformation',
];

function makeThumbnail(resource, config) {
  const cloudinary = new cloudinaryCore({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
  });

  let url;
  resource.raw_transformation = resource.raw_transformation || '';
  const alt = [resource.public_id, ...(resource.tags || [])].join(', ');
  let transformations = `${resource.raw_transformation}/c_fill,h_100,w_150`;

  if (resource.resource_type === 'image' && VALID_IMAGE_FORMATS.includes(resource.format)) {
    url = cloudinary.url(resource.public_id, {
      type: resource.type,
      rawTransformation: transformations,
    });
  } else if (resource.resource_type === 'video') {
    url = cloudinary.video_thumbnail_url(resource.public_id, {
      type: resource.type,
      rawTransformation: transformations,
    });
  }

  return [url, alt];
}

async function renderDialog(sdk) {
  await loadScript('https://media-library.cloudinary.com/global/all.js');

  const { cloudinary } = window;
  const config = sdk.parameters.invocation;

  const transformations = [];

  // Handle format
  if (config.format !== 'none') {
    transformations.push({ fetch_format: config.format });
  }

  // Handle quality
  if (config.quality !== 'none') {
    transformations.push({ quality: config.quality });
  }

  const options = {
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    max_files: config.maxFiles,
    multiple: config.maxFiles > 1,
    inline_container: '#root',
    remove_header: true,
    default_transformations: [transformations],
  };

  const instance = cloudinary.createMediaLibrary(options, {
    insertHandler: (data) => sdk.close(data),
  });
  const showOptions = {};

  if (typeof config.startFolder === 'string' && config.startFolder.length) {
    showOptions.folder = { path: config.startFolder };
  }

  instance.show(showOptions);

  sdk.window.updateHeight(window.outerHeight);
}

async function openDialog(sdk, currentValue, config) {
  const maxFiles = config.maxFiles - currentValue.length;

  const result = await sdk.dialogs.openCurrentApp({
    position: 'center',
    title: CTA,
    shouldCloseOnOverlayClick: true,
    shouldCloseOnEscapePress: true,
    parameters: { ...config, maxFiles },
    width: 1400,
  });

  if (result && Array.isArray(result.assets)) {
    return result.assets.map((asset) => extractAsset(asset));
  } else {
    return [];
  }
}

function extractAsset(asset) {
  let res = pick(asset, FIELDS_TO_PERSIST);
  // if we have a derived images, we replace the URL with the derived URL and store the origianl URL seperatly
  if (asset.derived) {
    res = {
      ...res,
      original_url: res.url,
      original_secure_url: res.secure_url,
      url: asset.derived[0].url,
      secure_url: asset.derived[0].secure_url,
      raw_transformation: asset.derived[0].raw_transformation,
    };
  }
  return res;
}

function isDisabled(currentValue, config) {
  return currentValue.length >= config.maxFiles;
}

function validateParameters(parameters) {
  if (parameters.cloudName.length < 1) {
    return 'Provide your Cloudinary Cloud name.';
  }

  if (parameters.apiKey.length < 1) {
    return 'Provide your Cloudinary API key.';
  }

  const validFormat = /^[1-9][0-9]*$/.test(parameters.maxFiles);
  const int = parseInt(parameters.maxFiles, 10);
  const valid = validFormat && int > 0 && int <= MAX_FILES_UPPER_LIMIT;
  if (!valid) {
    return `Max files should be a number between 1 and ${MAX_FILES_UPPER_LIMIT}.`;
  }

  return null;
}

setup({
  cta: CTA,
  name: 'Cloudinary',
  logo,
  description:
    'The Cloudinary app allows editors to select media from their Cloudinary account. Select the asset from Cloudinary that you want your entry to reference.',
  color: '#F4B21B',
  parameterDefinitions: [
    {
      id: 'cloudName',
      name: 'Cloud name',
      description: 'The Cloudinary cloud name that the app will connect to.',
      type: 'Symbol',
      required: true,
    },
    {
      id: 'apiKey',
      name: 'API key',
      description: 'The Cloudinary API Key that can be found in your Cloudinary console.',
      type: 'Symbol',
      required: true,
    },
    {
      id: 'maxFiles',
      name: 'Max number of files',
      description:
        'The max number of files that can be added to a single field. Must be between 1 and 25',
      type: 'Number',
      required: false,
      default: 10,
    },
    {
      id: 'startFolder',
      name: 'Starting folder',
      description:
        'A path to a folder which the Cloudinary Media Library will automatically browse to on load',
      type: 'Symbol',
      required: false,
      default: '',
    },
    {
      id: 'quality',
      name: 'Media Quality',
      description:
        "The quality level of your assets. This can be a fixed number ranging from 1-100, or you can get Cloudinary to decide the most optimized level by setting it to 'auto'. More options are available such as: auto:low/auto:eco/auto:good/auto:best. If you wish to use the original level, set it to 'none'.",
      type: 'List',
      value: 'auto,none,auto:low,auto:eco,auto:good,auto:best,10,20,30,40,50,60,70,80,90,100',
      required: true,
      default: 'auto',
    },
    {
      id: 'format',
      name: 'Format',
      description:
        "The format of the assets. This can be set manually to a specific format - 'jpg' as an example (all supported formats can be found here - https://cloudinary.com/documentation/image_transformations#supported_image_formats. By setting it to 'auto', Cloudinary will decide on the most optimized format for your users. If you wish to keep the original format, set it to 'none'.",
      type: 'List',
      value:
        'auto,none,gif,webp,bmp,flif,heif,heic,ico,jpg,jpe,jpeg,jp2,wdp,jxr,hdp,png,psd,arw,cr2,svg,tga,tif,tiff',
      required: true,
      default: 'auto',
    },
  ],
  makeThumbnail,
  renderDialog,
  openDialog,
  isDisabled,
  validateParameters,
});
