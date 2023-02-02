export interface PostMessageBody {
  channelId: string;
  message: string;
  workspaceId?: string;
}

export interface PostMessageParams {
  fromEvent?: string;
}

export const postMessageWorkspacesParamsSchema = {
  properties: {
    fromEvent: { type: 'string' },
  },
};

export const postMessageWorkspacesBodySchema = {
  type: 'object',
  properties: {
    channelId: { type: 'string' },
    message: { type: 'string' },
    workspaceId: { type: 'string' },
  },
  additionalProperties: false,
};
