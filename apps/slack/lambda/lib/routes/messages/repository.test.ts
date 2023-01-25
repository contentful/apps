import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { SlackClient } from '../../clients';
import { MessagesRepository } from './repository';
import { assert } from '../../../test/utils';

describe('MessagesRepository', () => {
  let instance: MessagesRepository;
  let slackClient: SinonStubbedInstance<SlackClient>;

  beforeEach(() => {
    slackClient = createStubInstance(SlackClient);

    instance = new MessagesRepository(slackClient);
  });

  describe('#postMessage', () => {
    it('throws when Slack throws', async () => {
      slackClient.postMessage.rejects(new Error('LOL'));

      try {
        await instance.create('token', 'channel', { text: 'message' });
        assert.fail('Did not throw');
      } catch (e) {
        assert.equal(String(e), 'Error: LOL');
      }
    });

    it('returns correct data', async () => {
      slackClient.postMessage.resolves({
        ok: true,
      });

      const result = await instance.create('token', 'channel', {
        text: 'message',
      });

      assert.deepEqual(result, { ok: true });
    });
  });
});
