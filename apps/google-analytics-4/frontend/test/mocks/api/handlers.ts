import { rest } from 'msw';
import { config } from '../../../src/config';

const apiRoot = config.backendApiUrl;

export const apiPath = (path: string) => {
  return new URL(path, apiRoot).toString();
};

export const handlers = [
  rest.get(apiPath('/api/credentials'), (_req, res, ctx) => {
    return res(ctx.json({ status: 'active' }));
  }),
];
