import { ContentTypeProps } from 'contentful-management';
import { generateRandomString } from '@test/mocks';

const createSys = (): ContentTypeProps['sys'] => ({
  space: { sys: { type: 'Link', linkType: 'Space', id: generateRandomString(12) } },
  id: 'page',
  type: 'ContentType',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  environment: { sys: { id: generateRandomString(8), type: 'Link', linkType: 'Environment' } },
  publishedVersion: 41,
  firstPublishedAt: new Date().toISOString(),
  createdBy: { sys: { type: 'Link', linkType: 'User', id: generateRandomString(22) } },
  updatedBy: { sys: { type: 'Link', linkType: 'User', id: generateRandomString(22) } },
  publishedCounter: 21,
  version: 42,
});

export { createSys };
