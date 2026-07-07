const shouldLoadOfflinePlugin = process.argv.includes('offline');

module.exports.plugins = [
  'serverless-domain-manager',
  ...(shouldLoadOfflinePlugin ? ['serverless-offline'] : []),
  'serverless-prune-plugin',
];
