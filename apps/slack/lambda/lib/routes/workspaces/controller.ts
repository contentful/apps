import { assertValid, asyncHandler } from '../../utils';
import { AuthTokenRepository } from '../auth-token';
import { WorkspacesRepository } from './repository';
import {
  ChannelsWorkspacesParameters,
  ChannelWorkspacesParameters,
  getChannelsParametersSchema,
  getChannelParametersSchema,
  getWorkspacesParametersSchema,
  WorkspacesParameters,
} from './validation';
import { getWorkspaceId } from '../../helpers/getWorkspaceId';

export class WorkspacesController {
  constructor(
    private readonly authTokenRepository: AuthTokenRepository,
    private readonly workspacesRepository: WorkspacesRepository
  ) {}

  /**
   * @openapi
   * /api/spaces/{spaceId}/environments/{environmentId}/workspaces/{workspaceId}:
   *   get:
   *     description: Fetch Slack workspace information
   *     parameters:
   *        - in: path
   *          name: spaceId
   *          description: Contentful space where Slack App is installed
   *        - in: path
   *          name: environmentId
   *          description: Contentful environment where Slack App is installed
   *        - in: path
   *          name: workspaceId
   *          description: Slack Workspace whose information is required
   *     responses:
   *       422:
   *         description: Unprocessable Entity. Path parameters are missing or invalid
   *         content:
   *           application/json:
   *             example: { "status": 422, "message": "UnprocessableEntity" }
   *       404:
   *         description: Not found. Thrown when the workspace does not exist or the request verification fails.
   *         content:
   *           application/json:
   *             example: { "status": 404, "message": "NotFound" }
   *       200:
   *         description: OK
   *         content:
   *           application/json:
   *             example: { "id": "WORKSPACE_ID", "name": "My workspace", "icon": { "image_34": "https://icons.com/icon.png" } }
   */
  get = asyncHandler(async (request, response) => {
    const { workspaceId, spaceId, environmentId } = assertValid<WorkspacesParameters>(
      getWorkspacesParametersSchema,
      request.params
    );

    const { token } = await this.authTokenRepository.get(workspaceId, {
      spaceId,
      environmentId,
    });

    const info = await this.workspacesRepository.get(token, workspaceId);

    response.status(200).send(info);
  });

  /**
   * @openapi
   * /api/spaces/{spaceId}/environments/{environmentId}/workspaces/{workspaceId}/channels:
   *   get:
   *     description: Fetch channels for a given registered workspace
   *     parameters:
   *        - in: path
   *          name: spaceId
   *          description: Contentful space where Slack App is installed
   *        - in: path
   *          name: environmentId
   *          description: Contentful environment where Slack App is installed
   *        - in: path
   *          name: workspaceId
   *          description: Slack Workspace whose information is required
   *     responses:
   *       422:
   *         description: Unprocessable Entity. Path parameters are missing or invalid
   *         content:
   *           application/json:
   *             example: { "status": 422, "message": "UnprocessableEntity" }
   *       404:
   *         description: Not found. Thrown when the workspace does not exist or the request verification fails.
   *         content:
   *           application/json:
   *             example: { "status": 404, "message": "NotFound" }
   *       200:
   *         description: OK
   *         content:
   *           application/json:
   *             example: [{ "id": "CHANNEL_ID", "name": "#my-channel" }]
   */
  getChannels = asyncHandler(async (request, response) => {
    const {
      workspaceId: workspaceIdFromParameters,
      spaceId,
      environmentId,
    } = assertValid<ChannelsWorkspacesParameters>(getChannelsParametersSchema, request.params);

    const workspaceId = await getWorkspaceId(spaceId, environmentId, workspaceIdFromParameters);

    const { token } = await this.authTokenRepository.get(workspaceId, {
      spaceId,
      environmentId,
    });

    try {
      const channels = await this.workspacesRepository.getChannels(token, workspaceId);

      response.status(200).send(channels);
    } catch(e) {
      console.error(e)
      response.status(500).send({ status: 500, message: 'Unable to fetch slack channels' })
    }

  });

/**
   * @openapi
   * /api/spaces/{spaceId}/environments/{environmentId}/workspaces/{workspaceId}/channel:
   *   get:
   *     description: Fetch a channel's information
   *     parameters:
   *        - in: path
   *          name: spaceId
   *          description: Contentful space where Slack App is installed
   *        - in: path
   *          name: environmentId
   *          description: Contentful environment where Slack App is installed
   *        - in: path
   *          name: workspaceId
   *          description: Slack Workspace whose information is required
   *        - in: path
   *          name: channelId
   *          descriptions: The channel for which this endpoint is fetching information
   *     responses:
   *       422:
   *         description: Unprocessable Entity. Path parameters are missing or invalid
   *         content:
   *           application/json:
   *             example: { "status": 422, "message": "UnprocessableEntity" }
   *       404:
   *         description: Not found. Thrown when the workspace does not exist or the request verification fails.
   *         content:
   *           application/json:
   *             example: { "status": 404, "message": "NotFound" }
   *       200:
   *         description: OK
   *         content:
   *           application/json:
   *             example: [{ "id": "CHANNEL_ID", "name": "#my-channel" }]
   */
  getChannel = asyncHandler(async (request, response) => {
    const {
      workspaceId: workspaceIdFromParameters,
      channelId,
      spaceId,
      environmentId,
    } = assertValid<ChannelWorkspacesParameters>(getChannelParametersSchema, request.params);

    const workspaceId = await getWorkspaceId(spaceId, environmentId, workspaceIdFromParameters);

    const { token } = await this.authTokenRepository.get(workspaceId, {
      spaceId,
      environmentId,
    });

    try {
      const channel = await this.workspacesRepository.getChannel(token, channelId);

      response.status(200).send(channel);
    } catch(e) {
      console.error(e)
      response.status(500).send({ status: 500, message: 'Unable to fetch slack channel' })
    }
  });
}
