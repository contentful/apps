function getEnvironmentVariable(environmentVariableName: string) {
  const environmentVariableValue = process.env[environmentVariableName];
  if (environmentVariableValue === undefined) {
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
};
