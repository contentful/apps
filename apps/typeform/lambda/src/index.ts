import { Express } from 'express';
// @ts-ignore 7016
import * as express from 'serverless-express/express';
// import * as path from 'path';
import fetch from 'node-fetch';

export function makeApp(_fetchFn: any) {
  const app = express() as Express;

  // async function makeClient() {}

  app.get('/test', async (_req, res) => {
    res.status(200).send('Ok');
  });

  app.use((_req, res) => res.status(404).send('Not found'));

  return app;
}

if (process.env.LOCAL_DEV === 'true') {
  makeApp(fetch).listen(8080);
  console.log('running on port: ', 8080);
}
