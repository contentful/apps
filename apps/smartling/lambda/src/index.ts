import { Express } from 'express';
// @ts-ignore 7016
import * as express from 'serverless-express/express';
import * as path from 'path';
import fetch from 'node-fetch';
import { Issuer } from 'openid-client';
import { URL } from 'url';

function requestProxier(proxyUrl: string, proxyPathPrefix = '') {
  console.log('[ index.ts ] requestProxier() proxyUrl => ', proxyUrl);

  return async (req: express.Request, res: express.Response) => {
    const joined = path.join(proxyPathPrefix, req.url);

    console.log('[ index.ts ] requestProxier() joined => ', joined);
    console.log('[ index.ts ] requestProxier() req.url => ', req.url);

    const url = new URL(path.join(proxyPathPrefix, req.url), proxyUrl);

    console.log('[ index.ts ] requestProxier() url => ', url);

    try {
      const response = await fetch(url.origin);
      response.body.pipe(res);
    } catch (error) {
      console.error('error => ', error);
    }
  };
}

async function makeClient(issuer: any) {
  const { Client } = await issuer.discover(
    'https://sso.smartling.com/auth/realms/Smartling/.well-known/openid-configuration'
  );

  const { CLIENT_ID, CLIENT_SECRET } = process.env;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('CLIENT_ID and/or CLIENT_SECRET were not provided!');
  }

  return new Client({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
  });
}

export function makeApp(fetchFn: any, issuer: any) {
  const app = express() as Express;

  app.get('/', async (req, res) => {
    console.log('[ lambda ] / req => ', req);

    if (!req.query.code) {
      console.error('No auth code was provided during Smartling OAuth handshake!');

      res.redirect(
        `/frontend/index.html?error=${encodeURIComponent(
          'No code was provided during OAuth handshake.'
        )}`
      );

      return;
    }

    const client = await makeClient(issuer);

    try {
      const params = client.callbackParams(req);
      const data = await client.callback('', params);

      res.redirect(
        `/frontend/index.html?access_token=${data.access_token}&refresh_token=${data.refresh_token}`
      );
    } catch (e) {
      // @ts-ignore
      console.error('Smartling OAuth failed with message: ', e.message);

      res.redirect(
        `/frontend/index.html?error=${encodeURIComponent(
          'An error occurred while authenticating with Smartling'
        )}`
      );
    }
  });

  // @ts-ignore
  app.get('/refresh', async (req, res) => {
    console.log('[ lambda ] /refresh req => ', req);

    const { refresh_token } = req.query;

    if (!refresh_token) {
      res.status(400).json({ message: 'No refresh_token was provided' });
      return;
    }

    const client = await makeClient(issuer);

    try {
      const data = await client.refresh(refresh_token);
      res.json({ access_token: data.access_token });
    } catch (e) {
      // @ts-ignore
      if (e.error === 'invalid_grant') {
        res.status(401).json({ message: 'Invalid or expired refresh_token was provided' });
        return;
      }
      // @ts-ignore
      console.error('Smartling refresh failed unexpectedly with error: ', e.message);

      res.sendStatus(500);
    }
  });

  // @ts-ignore
  app.get('/entry', async (req, res) => {
    console.log('[ lambda ] /entry req => ', req);

    const { entryId, projectId, spaceId } = req.query;

    const smartlingRes = await fetchFn(
      `https://dashboard.smartling.com/p/contentful-connector-api/v2/projects/${projectId}` +
        `/entries/${spaceId}-${entryId}`,
      {
        headers: {
          Authorization: req.headers.authorization || '',
          'content-type': 'application/json',
        },
      }
    );

    const data = await smartlingRes.json();
    res.status(smartlingRes.status).json(data.response);
  });

  // @ts-ignore
  app.get('/openauth', (_req, res) => {
    console.log('[ lambda ] openauth/ req => ', _req);

    res.redirect(
      `https://sso.smartling.com/auth/realms/Smartling/protocol/openid-connect/auth?response_type=code&client_id=${process.env.CLIENT_ID}`
    );
  });

  console.log('[ Lambda ] makeApp() process.env.LOCAL_DEV => ', process.env.LOCAL_DEV);
  console.log('[ Lambda ] makeApp() process.env.FRONTEND_URL => ', process.env.FRONTEND_URL);
  console.log('[ Lambda ] makeApp() process.env.CLIENT_ID => ', process.env.CLIENT_ID);
  console.log('[ Lambda ] makeApp() process.env.CLIENT_SECRET => ', process.env.CLIENT_SECRET);

  if (process.env.LOCAL_DEV === 'true' && process.env.FRONTEND_URL) {
    // in development mode, proxy requests to the frontend development server running at FRONTEND_URL
    app.use('/frontend', requestProxier(process.env.FRONTEND_URL));

    // in development mode, static assets are expressed as relative paths, which is served
    // under the backend and thus also needs to be proxied
    app.use('/static', requestProxier(process.env.FRONTEND_URL, 'static'));
  } else {
    // in production mode, frontend requests are served from the static smartling-frontend build folder
    app.use(
      '/frontend',
      express.static(path.dirname(require.resolve('@contentful/smartling-frontend')))
    );
  }

  // @ts-ignore
  app.use((_req, res) => res.status(404).send('Not found'));

  return app;
}

if (process.env.LOCAL_DEV === 'true') {
  makeApp(fetch, Issuer).listen(8080);
  console.log('running on port: ', 8080);
}
