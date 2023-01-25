export interface GetAuthTokenParameters {
  code: string;
  spaceId: string;
  environmentId: string;
}

export const getAuthTokenParametersSchema = {
  type: 'object',
  properties: {
    code: { type: 'string' },
    spaceId: { type: 'string' },
    environmentId: { type: 'string' },
  },
  required: ['code', 'spaceId', 'environmentId'],
  additionalProperties: true,
};

export interface PostAuthTokenBody {
  refreshToken: string;
}

export const postAuthTokenBodySchema = {
  type: 'object',
  properties: {
    refreshToken: { type: 'string' },
  },
  required: ['refreshToken'],
  additionalProperties: true,
};
