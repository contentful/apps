export const corsConfig = {
  origin: '*',
  methods: 'GET,PUT,POST,PATCH,DELETE,OPTIONS',
  allowedHeaders: [
    'Authorization',
    // Contentful SDK Headers
    'X-Contentful-Timestamp',
    'X-Contentful-Signed-Headers',
    'X-Contentful-Signature',
    'X-Contentful-User-ID',
    'X-Contentful-Space-ID',
    'X-Contentful-Environment-ID',
    'X-Contentful-App-ID',
    // ContentfulServiceAccountHeaders
    'X-Contentful-ServiceAccountKeyId',
    'X-Contentful-ServiceAccountKey',
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
