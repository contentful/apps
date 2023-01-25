import { assertValid } from '../../utils';
import { eventMessageWorkspacesBodySchema } from './validation';
import { assert } from '../../../test/utils';
import { UnprocessableEntityException } from '../../errors';
import { EventEntity } from './types';

export const entryBody = {
  metadata: { tags: [] },
  sys: {
    type: 'Entry',
    id: '5GuKAmmVV1X9jLNlDZzG4q',
    space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
    environment: {
      sys: { type: 'Link', linkType: 'Environment', id: 'env-id' },
    },
    contentType: {
      sys: { type: 'Link', linkType: 'ContentType', id: 'content-type' },
    },
    revision: 19,
    createdAt: '2022-01-19T14:09:40.995Z',
    updatedAt: '2022-01-25T11:12:50.790Z',
  },
  fields: {
    message: { ee: 'dfdfsdddfsd', 'to-TO': 'Testin' },
    anotherField: { ee: 'dd' },
  },
} as unknown as EventEntity;

describe('event validation schema', () => {
  it('entry body is valid', () => {
    const data = assertValid(eventMessageWorkspacesBodySchema, entryBody);
    assert.deepEqual(data, entryBody);
  });
  it('not valid when entry does contain wrong space', () => {
    assert.throws(() => {
      assertValid(eventMessageWorkspacesBodySchema, {
        ...entryBody,
        sys: { ...entryBody.sys, space: 'space' },
      });
    }, UnprocessableEntityException);
  });
});
