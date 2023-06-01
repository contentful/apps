/* eslint-disable @typescript-eslint/no-explicit-any */
import { createStubInstance, SinonStub, SinonStubbedInstance, stub } from 'sinon';
import { assert, mockRequest, mockResponse, runHandler } from '../../../test/utils';
import { EventsController } from './controller';
import { EventsService } from './service';
import { SlackAppEventKey, SlackNotification } from './types';
import { entryBody } from './validation.test';

const mockedNotification: SlackNotification = {
  selectedEvent: {
    [SlackAppEventKey.CREATED]: false,
    [SlackAppEventKey.DELETED]: false,
    [SlackAppEventKey.PUBLISH]: false,
    [SlackAppEventKey.UNPUBLISHED]: false,
  },
  selectedChannel: 'channel',
  selectedContentType: 'contentType',
};

describe('EventsController', () => {
  let instance: EventsController;
  let eventsService: SinonStubbedInstance<EventsService>;
  let verifier: SinonStub;

  beforeEach(() => {
    eventsService = createStubInstance(EventsService);
    verifier = stub();

    instance = new EventsController(eventsService, verifier);
  });

  describe('#post', () => {
    it('does nothing if there are no installationParameters', async () => {
      eventsService.getInstallationParameters.resolves(undefined);
      eventsService.convertToEventKey.resolves('DELETE');
      const request = mockRequest({
        body: entryBody,
        headers: {
          ['x-contentful-space-id']: 'space',
          ['x-contentful-environment-id']: 'env',
        },
      });
      const next = stub();
      const response = mockResponse();
      await runHandler(instance.post(request, response, next));

      assert.calledWith(response.sendStatus, 204);
      assert.notCalled(eventsService.sendMessagesForNotifications);
    });

    it('does nothing if notifications are disabled', async () => {
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
      eventsService.getInstallationParameters.resolves({
        active: false,
        workspaces: ['workspace'],
        notifications,
      });
      eventsService.convertToEventKey.resolves('DELETE');
      const request = mockRequest({
        body: entryBody,
        headers: {
          ['x-contentful-space-id']: 'space',
          ['x-contentful-environment-id']: 'env',
        },
      });
      const next = stub();
      const response = mockResponse();
      await runHandler(instance.post(request, response, next));

      assert.calledWith(response.sendStatus, 204);
      assert.notCalled(eventsService.sendMessagesForNotifications);
    });

    it('does nothing if there are no workspaces connected', async () => {
      eventsService.getInstallationParameters.resolves({ workspaces: [] });
      eventsService.convertToEventKey.resolves('DELETE');
      const request = mockRequest({
        body: entryBody,
        headers: {
          ['x-contentful-space-id']: 'space',
          ['x-contentful-environment-id']: 'env',
        },
      });
      const next = stub();
      const response = mockResponse();
      await runHandler(instance.post(request, response, next));

      assert.calledWith(response.sendStatus, 204);
      assert.notCalled(eventsService.sendMessagesForNotifications);
    });
  });

  describe('create is successful when', () => {
    let response: any;

    let notifications: SlackNotification[] = [];
    const request = mockRequest({
      body: entryBody,
      headers: {
        ['x-contentful-space-id']: 'space',
        ['x-contentful-environment-id']: 'env',
      },
    });

    beforeEach(async () => {
      notifications = [
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
      eventsService = createStubInstance(EventsService);
      verifier = stub();
      verifier.returns(true);
      eventsService.convertToEventKey.returns(SlackAppEventKey.CREATED);
      eventsService.createMessageBlocks.returns([]);
      eventsService.getInstallationParameters.resolves({
        active: true,
        workspaces: ['workspace'],
        notifications,
      });
      eventsService.getResolvedEntity.resolves({});

      instance = new EventsController(eventsService, verifier);

      const next = stub();
      response = mockResponse();
      await runHandler(instance.post(request, response, next));
    });
    it('called with valid arguments', () => {
      assert.calledWith(
        eventsService.sendMessagesForNotifications,
        notifications,
        SlackAppEventKey.CREATED,
        'workspace',
        entryBody
      );
      assert.calledWith(response.sendStatus, 204);
    });
  });
});
