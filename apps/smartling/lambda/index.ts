// @ts-ignore 7016
import * as handler from 'serverless-express/handler';
import { makeApp } from './src';
import { Issuer } from 'openid-client';
import fetch from 'node-fetch';

export const api = handler(makeApp(fetch, Issuer));
