import {
  createStubInstance,
  SinonFakeTimers,
  SinonStubbedInstance,
  useFakeTimers,
  stub,
  restore,
} from 'sinon';

import { AuthTokenRepository } from './repository';
import { SlackClient, SingleTableClient } from '../../clients';
import { assert } from '../../../test/utils';
import { AuthToken, Entity } from '../../interfaces';
import { NotFoundException, SlackError, UnprocessableEntityException } from '../../errors';
import { ConflictException } from '../../errors/conflict';
import * as helpers from '../../helpers/getInstallationParameters';
import { SlackAppEventKey, SlackAppInstallationParameters } from '../events/types';

const DEFAULT_EXPIRES_IN = 12 * 60 * 60; // 12 hours
const UUID = '1234';
const expectedParams: SlackAppInstallationParameters = {
  notifications: [
    {
      selectedChannel: 'channel',
      selectedContentType: 'contentType',
      selectedEvent: {} as Record<SlackAppEventKey, boolean>,
    },
  ],
  workspaces: ['workspace'],
  installationUuid: UUID,
};

describe('AuthTokenRepository', () => {
  let instance: AuthTokenRepository;
  let singleTableClient: SinonStubbedInstance<SingleTableClient>;
  let slackClient: SinonStubbedInstance<SlackClient>;
  let clock: SinonFakeTimers;

  beforeEach(() => {
    singleTableClient = createStubInstance(SingleTableClient);
    slackClient = createStubInstance(SlackClient);

    instance = new AuthTokenRepository(singleTableClient, slackClient);
    clock = useFakeTimers();
  });

  before(() => {
    stub(helpers, 'getInstallationParametersFromCma').resolves(expectedParams);
  });

  afterEach(() => {
    clock.restore();
  });

  after(() => {
    restore();
  });

  describe('#validate', () => {
    it('returns access token, refresh token and workspace', async () => {
      slackClient.getAuthToken.resolves({
        ok: true,
        team: { id: 'team', name: 'team' },
        access_token: 'token',
        refresh_token: 'refresh-token',
        expires_in: DEFAULT_EXPIRES_IN,
      });

      assert.deepEqual(
        await instance.validate('code', {
          spaceId: 'spaceId',
          environmentId: 'environmentId',
        }),
        {
          token: 'token',
          refreshToken: 'refresh-token',
          slackWorkspaceId: 'team',
        }
      );
    });

    it('fails when rotation is not enabled', async () => {
      slackClient.getAuthToken.resolves({
        ok: true,
        team: { id: 'team', name: 'team' },
        access_token: 'token',
      });

      try {
        await instance.validate('code', {
          spaceId: 'spaceId',
          environmentId: 'environmentId',
        });
        assert.fail('Did not reject');
      } catch (e) {
        assert.instanceOf(e, ConflictException);
      }
    });

    it('fails when unexpected response comes from Slack', async () => {
      slackClient.getAuthToken.resolves({
        ok: true,
        refresh_token: 'token',
        faulty: 'response',
      });

      try {
        await instance.validate('code', {
          spaceId: 'spaceId',
          environmentId: 'environmentId',
        });
        assert.fail('Did not reject');
      } catch (e) {
        assert.instanceOf(e, SlackError);
      }
    });
  });

  describe('#put', () => {
    it('saves correct information', async () => {
      slackClient.refreshToken.resolves({
        ok: true,
        team: { id: 'team', name: 'team' },
        access_token: 'token',
        refresh_token: 'refresh-token',
        expires_in: DEFAULT_EXPIRES_IN,
        installationUuid: UUID,
      });

      singleTableClient.queryByWorkspaceId.resolves([]);

      const response = await instance.put(
        'refresh-token',
        {
          spaceId: 'spaceId',
          environmentId: 'environmentId',
        },
        UUID
      );

      const expectedData: AuthToken = {
        token: 'token',
        expiresAt: Date.now() + DEFAULT_EXPIRES_IN * 1_000,
        refreshToken: 'refresh-token',
        spaceId: 'spaceId',
        environmentId: 'environmentId',
        installationUuid: UUID,
        slackWorkspaceId: 'team',
      };
      assert.calledWith(
        singleTableClient.put,
        Entity.AuthToken,
        UUID,
        ['spaceId', UUID],
        expectedData
      );
      assert.deepEqual(response, expectedData);
    });

    it('throws UnprocessableEntityException with missing information', async () => {
      slackClient.refreshToken.resolves({
        ok: true,
        team: { id: 'team', name: 'team' },
        access_token: 'token',
        refresh_token: 'refresh-token',
        expires_in: 4_200,
      });

      try {
        await instance.put(
          'code',
          {
            // @ts-expect-error expected from scenario
            spaceId: null,
            // @ts-expect-error expected from scenario
            environmentId: null,
          },
          UUID
        );
        assert.fail('Did not reject');
      } catch (e) {
        assert.instanceOf(e, UnprocessableEntityException);
      }
    });

    it('updates existing AuthTokens of the same slack workspace', async () => {
      const newAuthToken: AuthToken = {
        token: 'token-1',
        expiresAt: Date.now() + DEFAULT_EXPIRES_IN * 1_000,
        refreshToken: 'refresh-token-1',
        spaceId: 'spaceId-1',
        environmentId: 'environmentId-1',
        installationUuid: UUID,
        slackWorkspaceId: 'team',
      };

      const existingAuthToken: AuthToken = {
        token: 'token-2',
        expiresAt: Date.now() + DEFAULT_EXPIRES_IN * 100,
        refreshToken: 'refresh-token-2',
        spaceId: 'spaceId-2',
        environmentId: 'environmentId-2',
        installationUuid: UUID,
        slackWorkspaceId: 'team',
      };

      slackClient.refreshToken.resolves({
        ok: true,
        team: { id: 'team', name: 'team' },
        access_token: 'token-1',
        refresh_token: 'refresh-token-1',
        expires_in: DEFAULT_EXPIRES_IN,
        installationUuid: UUID,
      });

      singleTableClient.queryByWorkspaceId.resolves([existingAuthToken]);

      await instance.put(
        'code',
        {
          spaceId: 'spaceId-1',
          environmentId: 'environmentId-1',
        },
        UUID
      );

      assert.calledWith(
        singleTableClient.put,
        Entity.AuthToken,
        UUID,
        ['spaceId-1', UUID],
        newAuthToken
      );

      assert.calledWith(singleTableClient.put, Entity.AuthToken, UUID, ['spaceId-2', UUID], {
        ...existingAuthToken,
        token: newAuthToken.token,
        expiresAt: newAuthToken.expiresAt,
        refreshToken: newAuthToken.refreshToken,
      });
    });
  });

  describe('#get', () => {
    it('returns data from database', async () => {
      const data = { token: 'lol' } as AuthToken;
      singleTableClient.get.resolves(data);

      const r = await instance.get(
        'workspaceId',
        {
          spaceId: 'spaceId',
          environmentId: 'envId',
        },
        ''
      );

      assert.deepEqual(r, data);
    });

    it('throws NotFoundException when something is missing', async () => {
      singleTableClient.get.resolves(undefined);

      try {
        await instance.get(
          'workspaceId',
          {
            spaceId: 'spaceId',
            environmentId: 'envId',
          },
          ''
        );
        assert.fail('Did not reject');
      } catch (e) {
        assert.instanceOf(e, NotFoundException);
      }
    });

    it('refreshes expired token', async () => {
      const oldToken: AuthToken = {
        token: 'token-old',
        expiresAt: Date.now() - DEFAULT_EXPIRES_IN * 1_000,
        refreshToken: 'refresh-token-old',
        spaceId: 'space',
        environmentId: 'env',
        installationUuid: UUID,
        slackWorkspaceId: 'workspace',
      };
      const otherToken: AuthToken = {
        token: 'token-old',
        expiresAt: Date.now() - DEFAULT_EXPIRES_IN * 1_000,
        refreshToken: 'refresh-token-old',
        spaceId: 'space-other',
        environmentId: 'env-other',
        installationUuid: `${UUID}-other`,
        slackWorkspaceId: 'workspace',
      };
      const newToken: AuthToken = {
        ...oldToken,
        token: 'token-new',
        refreshToken: 'refresh-token-new',
        expiresAt: Date.now() + DEFAULT_EXPIRES_IN * 1_000,
      };
      const newOtherToken: AuthToken = {
        ...otherToken,
        token: 'token-new',
        refreshToken: 'refresh-token-new',
        expiresAt: Date.now() + DEFAULT_EXPIRES_IN * 1_000,
      };

      singleTableClient.get.resolves(oldToken);
      singleTableClient.queryByWorkspaceId.resolves([oldToken, otherToken]);
      slackClient.refreshToken.resolves({
        ok: true,
        team: { id: 'workspace', name: 'workspace' },
        access_token: 'token-new',
        refresh_token: 'refresh-token-new',
        expires_in: DEFAULT_EXPIRES_IN,
      });

      const response = await instance.get(
        'workspace',
        {
          spaceId: 'space',
          environmentId: 'env',
        },
        ''
      );

      assert.deepEqual(response, newToken);
      assert.calledWith(singleTableClient.put, Entity.AuthToken, UUID, ['space', UUID], newToken);
      assert.calledWith(
        singleTableClient.put,
        Entity.AuthToken,
        `${UUID}-other`,
        ['space-other', `${UUID}-other`],
        newOtherToken
      );
    });

    it('throws if refresh fails', async () => {
      const oldToken: AuthToken = {
        token: 'token-old',
        expiresAt: Date.now() - DEFAULT_EXPIRES_IN * 1_000,
        refreshToken: 'refresh-token-old',
        spaceId: 'space',
        environmentId: 'env',
        installationUuid: '1234',
        slackWorkspaceId: 'workspace',
      };
      const otherToken: AuthToken = {
        token: 'token-old',
        expiresAt: Date.now() - DEFAULT_EXPIRES_IN * 1_000,
        refreshToken: 'refresh-token-old',
        spaceId: 'space-other',
        environmentId: 'env-other',
        installationUuid: '1234',
        slackWorkspaceId: 'workspace',
      };

      singleTableClient.get.resolves(oldToken);
      singleTableClient.queryByWorkspaceId.resolves([oldToken, otherToken]);
      slackClient.refreshToken.rejects(new SlackError({ errMessage: 'unknown' }));

      await assert.rejects(
        instance.get(
          'workspace',
          {
            spaceId: 'space',
            environmentId: 'env',
          },
          ''
        ),
        NotFoundException
      );

      assert.notCalled(singleTableClient.delete);
    });

    it('deletes token if refresh fails with invalid_refresh_token', async () => {
      const oldToken: AuthToken = {
        token: 'token-old',
        expiresAt: Date.now() - DEFAULT_EXPIRES_IN * 1_000,
        refreshToken: 'refresh-token-old',
        spaceId: 'space',
        environmentId: 'env',
        installationUuid: '1234',
        slackWorkspaceId: 'workspace',
      };
      const otherToken: AuthToken = {
        token: 'token-old',
        expiresAt: Date.now() - DEFAULT_EXPIRES_IN * 1_000,
        refreshToken: 'refresh-token-old',
        spaceId: 'space-other',
        environmentId: 'env-other',
        installationUuid: '1234',
        slackWorkspaceId: 'workspace',
      };

      singleTableClient.get.resolves(oldToken);
      singleTableClient.queryByWorkspaceId.resolves([oldToken, otherToken]);
      slackClient.refreshToken.rejects(new SlackError({ errMessage: 'invalid_refresh_token' }));

      await assert.rejects(
        instance.get(
          'workspace',
          {
            spaceId: 'space',
            environmentId: 'env',
          },
          ''
        ),
        NotFoundException
      );

      assert.calledTwice(singleTableClient.delete);
    });
  });

  describe('#deleteByWorkspaceId', () => {
    it('handles 0 stored AuthTokens', async () => {
      singleTableClient.queryByWorkspaceId.resolves([]);

      await instance.deleteByWorkspaceId('workspace-id');

      assert.calledOnce(singleTableClient.queryByWorkspaceId);
      assert.calledWith(singleTableClient.queryByWorkspaceId, Entity.AuthToken, 'workspace-id');

      assert.notCalled(singleTableClient.delete);
    });

    it('handles multiple stored AuthTokens', async () => {
      const data: AuthToken[] = [
        {
          environmentId: 'env-1',
          slackWorkspaceId: 'workspace-1',
          spaceId: 'space-1',
          token: 'token-1',
          installationUuid: '1234',
          refreshToken: 'refresh-token-1',
          expiresAt: Date.now() + DEFAULT_EXPIRES_IN * 1_000,
        },
        {
          environmentId: 'env-2',
          slackWorkspaceId: 'workspace-2',
          spaceId: 'space-2',
          token: 'token-2',
          installationUuid: '1234',
          refreshToken: 'refresh-token-2',
          expiresAt: Date.now() + DEFAULT_EXPIRES_IN * 1_000,
        },
      ];

      singleTableClient.queryByWorkspaceId.resolves(data);

      await instance.deleteByWorkspaceId('workspace-id');

      assert.calledOnce(singleTableClient.queryByWorkspaceId);
      assert.calledWith(singleTableClient.queryByWorkspaceId, Entity.AuthToken, 'workspace-id');

      assert.calledTwice(singleTableClient.delete);
      assert.calledWith(singleTableClient.delete, Entity.AuthToken, `space-1.env-1.workspace-1`);
      assert.calledWith(singleTableClient.delete, Entity.AuthToken, `space-2.env-2.workspace-2`);
    });
  });
});
