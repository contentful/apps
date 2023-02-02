export const eventMessageWorkspacesBodySchema = {
  type: 'object',
  properties: {
    sys: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        space: {
          type: 'object',
          properties: {
            sys: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['Link'] },
                linkType: { type: 'string', enum: ['Space'] },
                id: { type: 'string', minLength: 1 },
              },
              required: ['type', 'linkType', 'id'],
              additionalProperties: false,
            },
            additionalProperties: false,
          },
        },
        contentType: {
          type: 'object',
          properties: {
            sys: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['Link'] },
                linkType: { type: 'string', enum: ['ContentType'] },
                id: { type: 'string', minLength: 1 },
              },
              required: ['type', 'linkType', 'id'],
              additionalProperties: false,
            },
          },
          additionalProperties: false,
        },
        environment: {
          type: 'object',
          properties: {
            sys: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['Link'] },
                linkType: { type: 'string', enum: ['Environment'] },
                id: { type: 'string', minLength: 1 },
              },
              required: ['type', 'linkType', 'id'],
              additionalProperties: false,
            },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};
