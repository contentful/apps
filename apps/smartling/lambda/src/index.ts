import { Express } from 'express';
// @ts-ignore 7016
import * as express from 'serverless-express/express';
import * as path from 'path';
import fetch from 'node-fetch';
import { Issuer } from 'openid-client';

export function makeApp(fetchFn: any, issuer: any) {
  const app = express() as Express;

  async function makeClient() {
    const { Client } = await issuer.discover(
      'https://sso.smartling.com/auth/realms/Smartling/.well-known/openid-configuration'
    );

    const { CLIENT_ID, CLIENT_SECRET } = process.env;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('CLIENT_ID and/or CLIENT_SECRET were not provided!');
    }

    return new Client({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET
    });
  }

  app.get('/', async (req, res) => {
    if (!req.query.code) {
      console.error('No auth code was provided during Smartling OAuth handshake!');

      res.redirect(
        `/frontend/index.html?error=${encodeURIComponent(
          'No code was provided during OAuth handshake.'
        )}`
      );

      return;
    }

    const client = await makeClient();

    try {
      const params = client.callbackParams(req);
      const data = await client.callback('', params);

      res.redirect(
        `/frontend/index.html?access_token=${data.access_token}&refresh_token=${data.refresh_token}`
      );
    } catch (e) {
      console.error('Smartling OAuth failed with message: ', e.message);

      res.redirect(
        `/frontend/index.html?error=${encodeURIComponent(
          'An error occurred while authenticating with Smartling'
        )}`
      );
    }
  });

  app.get('/refresh', async (req, res) => {
    const { refresh_token } = req.query;

    if (!refresh_token) {
      res.status(400).json({ message: 'No refresh_token was provided' });
      return;
    }

    const client = await makeClient();

    try {
      const data = await client.refresh(refresh_token);
      res.json({ access_token: data.access_token });
    } catch (e) {
      if (e.error === 'invalid_grant') {
        res.status(401).json({ message: 'Invalid or expired refresh_token was provided' });
        return;
      }

      console.error('Smartling refresh failed unexpectedly with error: ', e.message);

      res.sendStatus(500);
    }
  });

  app.get('/entry', async (req, res) => {
    const { entryId, projectId, spaceId } = req.query;

    const smartlingRes = await fetchFn(
      `https://dashboard.smartling.com/p/contentful-connector-api/v2/projects/${projectId}` +
        `/entries/${spaceId}-${entryId}`,
      {
        headers: {
          Authorization: req.headers.authorization || '',
          'content-type': 'application/json'
        }
      }
    );

    const data = await smartlingRes.json();
    res.status(smartlingRes.status).json(data.response);
  });

  app.get('/openauth', (_req, res) => {
    res.redirect(
      `https://sso.smartling.com/auth/realms/Smartling/protocol/openid-connect/auth?response_type=code&client_id=${process.env.CLIENT_ID}`
    );
  });

  app.use('/frontend', express.static(path.resolve(__dirname, '../node_modules/smartling-frontend/build')));

  app.use((_req, res) => res.status(404).send('Not found'));

  return app;
}

if (process.env.LOCAL_DEV === 'true') {
  makeApp(fetch, Issuer).listen(8080);
  console.log('running on port: ', 8080);
}
