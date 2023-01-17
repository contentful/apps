import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { SlackClient } from '../../clients';
import { WorkspacesRepository } from './repository';
import { assert } from '../../../test/utils';
import { NotFoundException } from '../../errors';

describe('WorkspacesRepository', () => {
  let instance: WorkspacesRepository;
  let slackClient: SinonStubbedInstance<SlackClient>;

  beforeEach(() => {
    slackClient = createStubInstance(SlackClient);

    instance = new WorkspacesRepository(slackClient);
  });

  describe('#get', () => {
    it('throws NotFoundException if missing or invalid team', async () => {
      slackClient.getWorkspaceInformation.resolves(undefined);

      try {
        await instance.get('token', 'workspace');
        assert.fail('Did not throw');
      } catch (e) {
        assert.instanceOf(e, NotFoundException);
      }
    });

    it('throws when Slack throws', async () => {
      slackClient.getWorkspaceInformation.rejects(new Error('LOL'));

      try {
        await instance.get('token', 'workspace');
        assert.fail('Did not throw');
      } catch (e) {
        assert.equal(String(e), 'Error: LOL');
      }
    });

    it('returns correct data', async () => {
      slackClient.getWorkspaceInformation.resolves({
        ok: true,
        team: { id: 'team', name: 'the team', icon: {} },
      });

      const result = await instance.get('token', 'workspace');

      assert.deepEqual(result, { id: 'team', name: 'the team', icon: {} });
    });
  });
});
