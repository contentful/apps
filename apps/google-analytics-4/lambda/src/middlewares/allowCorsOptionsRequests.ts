import { RequestHandler } from 'express';

export const allowCorsOptionsRequests: RequestHandler = (_req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    [
      'Authorization',
      'X-Contentful-Timestamp',
      'X-Contentful-Signed-Headers',
      'X-Contentful-Signature',
      'X-Contentful-User-ID',
      'X-Contentful-Space-ID',
      'X-Contentful-Environment-ID',
      'X-Contentful-App-ID',
      'x-contentful-serviceaccountkeyid',
      'x-contentful-serviceaccountkey',
    ].join(', ')
  );
  res.send(200);
};
