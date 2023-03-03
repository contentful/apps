export const corsConfig = {
  origin: '*', // TODO: set this to production domain once configured in Route 53
  methods: 'GET,PUT,POST,PATCH,DELETE,OPTIONS',
  allowedHeaders: [
    'Authorization',
    'X-Contentful-Timestamp',
    'X-Contentful-Signed-Headers',
    'X-Contentful-Signature',
    'X-Contentful-User-ID',
    'X-Contentful-Space-ID',
    'X-Contentful-Environment-ID',
    'X-Contentful-App-ID',
    'X-Contentful-ServiceAccountKeyId',
    'X-Contentful-ServiceAccountKey',
  ],
};
