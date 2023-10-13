import { verifyRequest } from '@contentful/node-apps-toolkit';
import { assertValid, asyncHandler } from '../../utils';
import { EventsService } from './service';
import { EventEntity } from './types';
import { eventMessageWorkspacesBodySchema } from './validation';
import { getHost } from '../../helpers/getHost';

export class EventsController {
  private readonly verifyRequest: typeof verifyRequest;

  constructor(
    private readonly eventsService: EventsService,
    verifier = verifyRequest
  ) {
    this.verifyRequest = verifier;
  }

  post = asyncHandler(async (request, response) => {
    const validEventBody = assertValid<EventEntity>(eventMessageWorkspacesBodySchema, request.body);

    const spaceId = validEventBody.sys.space.sys.id;
    const environmentId = validEventBody.sys.environment.sys.id;
    const host = getHost(request);

    const installationParameters = await this.eventsService.getInstallationParameters(
      spaceId,
      environmentId,
      host
    );

    const topic = request.header('x-contentful-topic');

    const eventKey = this.eventsService.convertToEventKey(topic);

    if (
      !installationParameters ||
      installationParameters.active === false ||
      !installationParameters.workspaces ||
      !installationParameters.workspaces[0] ||
      !eventKey ||
      !installationParameters.notifications
    ) {
      // if there are no installation parameters or its not an event we expect, we are doing nothing
      response.sendStatus(204);
      return;
    }

    // we only have one workspace connected for now and we know
    const workspaceId = installationParameters.workspaces[0];

    await this.eventsService.sendMessagesForNotifications(
      installationParameters.notifications,
      eventKey,
      workspaceId,
      validEventBody,
      host
    );

    response.sendStatus(204);
  });
}
