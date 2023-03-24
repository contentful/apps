import { rest } from 'msw';
import { config } from 'config';
import { mockAccountSummary } from './mockData';
import { runReportData } from '../../../../lambda/public/sampleData/MockData';
const apiRoot = config.backendApiUrl;

export const apiPath = (path: string) => {
  return new URL(path, apiRoot).toString();
};

export const handlers = [
  rest.get(apiPath('/api/service_account_key_file'), (_req, res, ctx) => {
    return res(ctx.json({ status: 'active' }));
  }),

  rest.get(apiPath('/api/account_summaries'), (_req, res, ctx) => {
    return res(ctx.json([mockAccountSummary]));
  }),

  rest.get(apiPath('/api/run_report'), async (_req, res, ctx) => res(ctx.json(runReportData))),
];
