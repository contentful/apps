export const mockDeploymentSummary = {
  serverlessFunctions: [
    {
      path: 'api/enable-draft',
      regions: ['iad1'],
      runtime: 'nodejs12.x',
      size: 1024,
      type: 'Page',
    },
    {
      path: 'api/disable-draft',
      regions: ['iad1'],
      runtime: 'nodejs12.x',
      size: 1024,
      type: 'Page',
    },
    {
      path: '_not-found',
      regions: ['iad1'],
      runtime: 'nodejs12.x',
      size: 1024,
      type: 'Page',
    },
    {
      path: 'blogs/[slug]',
      regions: ['iad1'],
      runtime: 'nodejs12.x',
      size: 1024,
      type: 'ISR',
    },
  ],
};
