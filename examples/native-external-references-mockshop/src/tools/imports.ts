import mockshopJson from './entities/mockshop.json';
import productJson from './entities/product.json';
import manifest from '../../contentful-app-manifest.json';
import assert from 'assert';
import type { ResourceProvider, ResourceType } from './types';

assert.equal(
  typeof manifest,
  'object',
  'Manifest is not an object, please check the content of `contentful-app-manifest.json`'
);
assert.ok(
  Array.isArray(manifest.functions),
  'Functions are not defined as an array in the manifest, please check the content of `contentful-app-manifest.json`'
);
const {
  CONTENTFUL_ORG_ID: organizationId = '',
  CONTENTFUL_APP_DEF_ID: appDefinitionId = '',
  CONTENTFUL_ACCESS_TOKEN: accessToken = '',
  CONTENTFUL_HOST: contentfulHost = '',
} = process.env;

assert.ok(organizationId !== '', `CONTENTFUL_ORG_ID environment variable must be defined`);

assert.ok(appDefinitionId !== '', `CONTENTFUL_APP_DEF_ID environment variable must be defined`);

assert.ok(accessToken !== '', `CONTENTFUL_ACCESS_TOKEN environment variable must be defined`);

const mockshop = mockshopJson as ResourceProvider;
const product = productJson as ResourceType;

export {
  organizationId,
  appDefinitionId,
  accessToken,
  contentfulHost,
  manifest,
  mockshop,
  product,
};
