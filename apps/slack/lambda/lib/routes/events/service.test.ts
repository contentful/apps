/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventsService } from './service';
import { ACCEPTED_EVENTS } from './constants';
import { assert } from '../../../test/utils';
import { NotFoundException } from '../../errors';
import { createStubInstance, SinonStubbedInstance, stub, restore } from 'sinon';
import { PlainClientAPI } from 'contentful-management';
import {
  EventEntity,
  SlackAppEventKey,
  SlackAppInstallationParameters,
  SlackNotification,
} from './types';
import { MessagesRepository } from '../messages';
import { AuthTokenRepository } from '../auth-token';
import { entryBody } from './validation.test';
import { AuthToken } from '../../interfaces';
import * as helpers from '../../helpers/getInstallationParameters';

describe('EventsService', () => {
  let instance: EventsService;
  let messagesRepository: SinonStubbedInstance<MessagesRepository>;
  let authTokenRepository: SinonStubbedInstance<AuthTokenRepository>;

  before(() => {
    stub(helpers, 'getInstallationParametersFromCma').resolves(expectedParams);
  });

  after(() => {
    restore();
  });

  beforeEach(() => {
    messagesRepository = createStubInstance(MessagesRepository);
    authTokenRepository = createStubInstance(AuthTokenRepository);

    const mockedMakeCmaClient = stub().resolves({
      appInstallation: {
        get: stub().resolves({
          sys: { id: 'appId' },
          parameters: expectedParams,
        }),
      },
      contentType: {
        get: stub().resolves({
          sys: { id: 'contentType' },
          displayField: 'main-field',
        }),
      },
      entry: {
        get: stub().resolves(entryMock),
      },
      locale: {
        getMany: stub().resolves({ items: [{ default: true, code: 'de-DE' }] }),
      },
    } as unknown as PlainClientAPI);
    authTokenRepository.get.resolves({ token: 'whatever' } as AuthToken);
    instance = new EventsService(
      ACCEPTED_EVENTS,
      authTokenRepository,
      messagesRepository,
      mockedMakeCmaClient
    );
  });

  const expectedParams: SlackAppInstallationParameters = {
    notifications: [
      {
        selectedChannel: 'channel',
        selectedContentType: 'contentType',
        selectedEvent: {} as Record<SlackAppEventKey, boolean>,
      },
    ],
    workspaces: ['workspace'],
  };

  const entryMock = {
    sys: {
      id: 'entry',
      publishedBy: { sys: { id: 'publisher' } },
      publishedAt: '2021-02-01T15:46:12Z',
    },
    fields: { ['main-field']: { 'de-DE': 'test' } },
  };

  describe('#convertEventKey', () => {
    it('returns the correct eventKey', () => {
      const eventKey = instance.convertToEventKey('Entry.publish');
      assert.equal(eventKey, 'publish');
    });
    it('returns undefined if event is not from expected type', () => {
      const eventKey = instance.convertToEventKey('Entry.destroy');
      assert.equal(eventKey, undefined);
    });
    it('returns undefined if header is empty', () => {
      const eventKey = instance.convertToEventKey(' ');
      assert.equal(eventKey, undefined);
    });
    it('throws not found when header not available', () => {
      let error: any;
      try {
        instance.convertToEventKey(undefined);
      } catch (e) {
        error = e;
      }

      assert.instanceOf(error, NotFoundException);
    });
  });
  describe('#getInstallationParameters', () => {
    it('returns the installation parameters if requests are set', async () => {
      const installationParams = await instance.getInstallationParameters(
        'space-id',
        'env-id',
        'host:contentful'
      );

      assert.equal(installationParams, expectedParams);
    });
    it('returns null if notifications are not defined', async () => {
      expectedParams.notifications = undefined;
      const installationParams = await instance.getInstallationParameters(
        'space-id',
        'env-id',
        'host:contentful'
      );

      assert.equal(installationParams, null);
    });
    it('returns null if there are no notifications', async () => {
      expectedParams.notifications = [];
      const installationParams = await instance.getInstallationParameters(
        'space-id',
        'env-id',
        'host:contentful'
      );

      assert.equal(installationParams, null);
    });

    it('throws a not found error if there is no workspace param', async () => {
      expectedParams.notifications = [
        {
          selectedChannel: 'channel',
          selectedContentType: 'contentType',
          selectedEvent: {} as Record<SlackAppEventKey, boolean>,
        },
      ];
      expectedParams.workspaces = undefined;
      let error: any;

      try {
        await instance.getInstallationParameters('space-id', 'env-id', 'host:contentful');
      } catch (e) {
        error = e;
      }
      assert.instanceOf(error, NotFoundException);
    });
    it('throws a not found error if there is no workspace connected', async () => {
      expectedParams.notifications = [
        {
          selectedChannel: 'channel',
          selectedContentType: 'contentType',
          selectedEvent: {} as Record<SlackAppEventKey, boolean>,
        },
      ];
      expectedParams.workspaces = [];
      let error: any;

      try {
        await instance.getInstallationParameters('space-id', 'env-id', 'host:contentful');
      } catch (e) {
        error = e;
      }
      assert.instanceOf(error, NotFoundException);
    });
  });
  describe('#getResolvedEntity', () => {
    const eventBody = {
      sys: {
        contentType: {
          sys: {
            id: 'contentType',
          },
        },
        createdBy: { sys: { id: 'creator' } },
        createdAt: '2021-03-01T15:46:12Z',
        publishedBy: { sys: { id: 'publisher' } },
        publishedAt: '2021-02-01T15:46:12Z',

        deletedAt: '2002-02-01T15:46:12Z',
      },
    } as unknown as EventEntity;

    it('returns the expected resolved values for PUBLISH', async () => {
      const expectedValue = {
        actorId: 'publisher',
        entryName: 'test',
        date: 'Mon Feb 01 2021',
        entity: entryMock,
      };
      const resolvedEntity = await instance.getResolvedEntity(
        'space-id',
        'env-id',
        'contentful',
        SlackAppEventKey.PUBLISH,
        eventBody
      );
      assert.deepEqual(resolvedEntity, expectedValue);
    });
    it('returns the expected resolved values for UNPUBLISHED', async () => {
      const expectedValue = {
        actorId: undefined,
        entryName: 'test',
        date: 'Mon Mar 01 2021',
        entity: entryMock,
      };
      const resolvedEntity = await instance.getResolvedEntity(
        'space-id',
        'env-id',
        'contentful',
        SlackAppEventKey.UNPUBLISHED,
        eventBody
      );
      assert.deepEqual(resolvedEntity, expectedValue);
    });
    it('returns the expected resolved values for CREATED', async () => {
      const expectedValue = {
        actorId: 'creator',
        entryName: undefined,
        date: 'Mon Mar 01 2021',
        entity: entryMock,
      };
      const resolvedEntity = await instance.getResolvedEntity(
        'space-id',
        'env-id',
        'contentful',
        SlackAppEventKey.CREATED,
        eventBody
      );
      assert.deepEqual(resolvedEntity, expectedValue);
    });
    it('returns the expected resolved values for DELETE', async () => {
      const expectedValue = {
        actorId: undefined,
        entryName: undefined,
        date: 'Fri Feb 01 2002',
        entity: undefined,
      };
      const resolvedEntity = await instance.getResolvedEntity(
        'space-id',
        'env-id',
        'contentful',
        SlackAppEventKey.DELETED,
        eventBody
      );
      assert.deepEqual(resolvedEntity, expectedValue);
    });
    describe('#sendMessagesForNotifications', () => {
      const mockedNotification: SlackNotification = {
        selectedEvent: {
          [SlackAppEventKey.CREATED]: false,
          [SlackAppEventKey.DELETED]: false,
          [SlackAppEventKey.PUBLISH]: false,
          [SlackAppEventKey.UNPUBLISHED]: false,
        },
        selectedChannel: 'channel',
        selectedContentType: 'content-type',
      };
      const notifications = [
        {
          ...mockedNotification,
          selectedEvent: {
            ...mockedNotification.selectedEvent,
            [SlackAppEventKey.CREATED]: true,
          },
        },
        {
          ...mockedNotification,
          selectedChannel: 'another-channel',
          selectedEvent: {
            ...mockedNotification.selectedEvent,
            [SlackAppEventKey.CREATED]: true,
          },
        },
      ];

      const eventKey = SlackAppEventKey.CREATED;
      const workspaceId = 'workspaceId';

      it('called twice with two selected notifications', async () => {
        await instance.sendMessagesForNotifications(
          notifications,
          eventKey,
          workspaceId,
          entryBody,
          'contentful'
        );
        assert.callCount(messagesRepository.create, 2);
      });

      it('called once with two selected notifications, but only one valid event', async () => {
        notifications[0].selectedEvent[SlackAppEventKey.CREATED] = false;
        await instance.sendMessagesForNotifications(
          notifications,
          eventKey,
          workspaceId,
          entryBody,
          'contentful'
        );
        assert.callCount(messagesRepository.create, 1);
      });
      it('called never with two selected notifications, but not a matching contentType', () => {
        notifications[0].selectedContentType = 'another';
        assert.callCount(messagesRepository.create, 0);
      });
      it('called never with two selected notifications, but not a channel selected', () => {
        notifications[0].selectedChannel = null;
        assert.callCount(messagesRepository.create, 0);
      });
    });
  });
});
