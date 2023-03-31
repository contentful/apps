type EnvironmentVariable = string | null | number | undefined;

function getEnvironmentVariable(
  environmentVariableName: string,
  fallback?: EnvironmentVariable
): string {
  const environmentVariableValue = process.env[environmentVariableName];
  if (!environmentVariableValue) {
    if (fallback) return fallback.toString();
    throw new Error(`Missing environment variable: '${environmentVariableName}'`);
  }
  return environmentVariableValue;
}

export const config = {
  signingSecret: getEnvironmentVariable('SIGNING_SECRET'),
  stage: getEnvironmentVariable('STAGE'),
  awsRegion: getEnvironmentVariable('AWS_REGION'),
  dynamoDbEndpoint: getEnvironmentVariable('DYNAMODB_ENDPOINT'),
  dynamoDbTableName: getEnvironmentVariable('DYNAMODB_TABLE_NAME'),
  serviceAccountKeyEncryptionSecret: getEnvironmentVariable(
    'SERVICE_ACCOUNT_KEY_ENCRYPTION_SECRET'
  ),
  sentryDSN: getEnvironmentVariable('SENTRY_DSN'),
  environment: getEnvironmentVariable('NODE_ENV'),
  release: getEnvironmentVariable('CIRCLE_SHA1', 'no-release-hash-set'),
};
