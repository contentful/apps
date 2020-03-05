// @ts-ignore 7016
import * as handler from 'serverless-express/handler';
import fetch from 'node-fetch';

export const api = handler(fetch);
