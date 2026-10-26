// @ts-ignore 7016
import * as awsServerlessExpress from 'aws-serverless-express';
import { makeApp } from './src';
import { Issuer } from 'openid-client';
import fetch from 'node-fetch';

const server = awsServerlessExpress.createServer(makeApp(fetch, Issuer));

export const api = (event: any, context: any) =>
  awsServerlessExpress.proxy(server, event, context, 'PROMISE').promise;
