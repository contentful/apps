import { config } from '../config';

const frontendUrl = new URL(config.frontendUrl);
const allowedUrls = [config.workflowsUrl, frontendUrl.origin, /(http:\/\/localhost):(\d{1,4})/];

export const corsConfig = {
  origin: allowedUrls,
  methods: 'GET,PUT,POST,PATCH,DELETE,OPTIONS',
  allowedHeaders: [
    'Authorization',
    'Content-Type',
    // Contentful SDK Headers
    'X-Contentful-Timestamp',
    'X-Contentful-Signed-Headers',
    'X-Contentful-Signature',
    'X-Contentful-User-ID',
    'X-Contentful-Space-ID',
    'X-Contentful-Environment-ID',
    'X-Contentful-App-ID',
    // ContentfulUUID
    'X-Contentful-UUID',
    // ContentfulContextHeaders
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
  ],
};
