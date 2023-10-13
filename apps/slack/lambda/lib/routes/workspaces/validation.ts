export interface WorkspacesParameters {
  workspaceId: string;
  spaceId: string;
  environmentId: string;
}
export type ChannelsWorkspacesParameters = Omit<WorkspacesParameters, 'workspaceId'> & {
  workspaceId?: string;
};

export type ChannelWorkspacesParameters = Omit<WorkspacesParameters, 'workspaceId'> & {
  workspaceId?: string;
  channelId: string;
};

export const getWorkspacesParametersSchema = {
  type: 'object',
  properties: {
    workspaceId: { type: 'string' },
    spaceId: { type: 'string' },
    environmentId: { type: 'string' },
  },
  required: ['workspaceId', 'spaceId', 'environmentId'],
  additionalProperties: false,
};

export const getChannelsParametersSchema = {
  type: 'object',
  properties: {
    workspaceId: { type: 'string' },
    spaceId: { type: 'string' },
    environmentId: { type: 'string' },
  },
};

export const getChannelParametersSchema = {
  type: 'object',
  properties: {
    workspaceId: { type: 'string' },
    spaceId: { type: 'string' },
    environmentId: { type: 'string' },
    channelId: { type: 'string' },
  },
};
