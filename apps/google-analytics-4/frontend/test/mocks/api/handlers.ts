import { rest } from 'msw';
import { config } from '../../../src/config';
import { mockAccountSummary } from './mockData';

const apiRoot = config.backendApiUrl;

export const apiPath = (path: string) => {
  return new URL(path, apiRoot).toString();
};

export const handlers = [
  rest.get(apiPath('/api/credentials'), (_req, res, ctx) => {
    return res(ctx.json({ status: 'active' }));
  }),

  rest.get(apiPath('/api/account_summaries'), (_req, res, ctx) => {
    return res(ctx.json([mockAccountSummary]));
  }),
];
