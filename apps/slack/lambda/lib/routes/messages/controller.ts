import { Request } from 'express-serve-static-core';
import { ConflictException } from '../../errors/conflict';
import { assertValid, asyncHandler } from '../../utils';
import { AuthTokenRepository } from '../auth-token';
import { MessagesRepository } from './repository';
import { PostMessageBody, postMessageWorkspacesBodySchema } from './validation';
import { getWorkspaceId } from '../../helpers/getWorkspaceId';

const extractFromSignedHeaders = (request: Request) => {
  const spaceId = request.header('x-contentful-space-id');
  const environmentId = request.header('x-contentful-environment-id');

  if (!spaceId || !environmentId) {
    throw new ConflictException({
      errMessage: 'EnvironmentId or spaceId not found in headers',
      spaceId,
      environmentId,
    });
  }

  return { environmentId, spaceId };
};

export class MessagesController {
  constructor(
    private readonly authTokenRepository: AuthTokenRepository,
    private readonly messagesRepository: MessagesRepository
  ) {}

  post = asyncHandler(async (request, response) => {
    const {
      message,
      workspaceId: workspaceIdFromParameters,
      channelId,
    } = assertValid<PostMessageBody>(postMessageWorkspacesBodySchema, request.body);

    const { spaceId, environmentId } = extractFromSignedHeaders(request);

    const workspaceId = await getWorkspaceId(spaceId, environmentId, workspaceIdFromParameters);

    const { token } = await this.authTokenRepository.get(workspaceId, {
      spaceId,
      environmentId,
    });

    await this.messagesRepository.create(token, channelId, { text: message });

    response.sendStatus(204);
  });
}
