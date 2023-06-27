import * as Sentry from '@sentry/node';
import { NextFunction, Request, Response } from 'express';

export const ContentfulContextHeaders = [
  'X-Contentful-App',
  'X-Contentful-ContentType',
  'X-Contentful-Entry',
  'X-Contentful-Environment',
  'X-Contentful-EnvironmentAlias',
  'X-Contentful-Field',
  'X-Contentful-Location',
  'X-Contentful-Organization',
  'X-Contentful-Space',
  'X-Contentful-User',
];

export const setSentryContext = (req: Request, _res: Response, next: NextFunction) => {
  Sentry.setUser({ id: req.header('X-Contentful-User') as Sentry.User['id'] });

  const downcasedHeaders = ContentfulContextHeaders.map((h) => h.toLowerCase());

  const contentfulContextHeaders = Object.keys(req.headers).filter((key) => {
    return downcasedHeaders.includes(key);
  });

  contentfulContextHeaders.forEach((header) => {
    const formattedHeader =
      ContentfulContextHeaders.find((h) => h.toLowerCase() === header) || header;

    if (req.header(header)) Sentry.setTag(formattedHeader, req.header(header) as string);
  });

  next();
};
