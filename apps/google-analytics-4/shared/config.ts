function getEnvironmentVariable(
  environmentVariableName: string,
  fallbackEnvironmentVariableName?: string
) {
  const environmentVariableValue = process.env[environmentVariableName];
  if (environmentVariableValue === undefined) {
    const fallbackEnvironmentVariableValue = fallbackEnvironmentVariableName;
    if (fallbackEnvironmentVariableValue !== undefined) {
      return fallbackEnvironmentVariableValue;
    }
    throw new Error(`Missing environment variable: '${environmentVariableName}'`);
  }
  return environmentVariableValue;
}

export const config = {
  backendApiUrl: getEnvironmentVariable('REACT_APP_BACKEND_API_URL'),
  environment: getEnvironmentVariable('NODE_ENV'),
  version: getEnvironmentVariable('REACT_APP_VERSION'),
  release: getEnvironmentVariable('REACT_APP_RELEASE', 'RELEASE_VERSION'),
  sentryDSN: getEnvironmentVariable('REACT_APP_SENTRY_DSN', 'SENTRY_DSN'),
  stage: getEnvironmentVariable('STAGE'),
  signingSecret: getEnvironmentVariable('SIGNING_SECRET'),
};
