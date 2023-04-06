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
  backendApiUrl: getEnvironmentVariable('REACT_APP_BACKEND_API_URL'),
  version: getEnvironmentVariable('REACT_APP_VERSION', 'no-version-set'),
  release: getEnvironmentVariable('REACT_APP_RELEASE', 'no-release-hash-set'),
  sentryDSN: getEnvironmentVariable('REACT_APP_SENTRY_DSN'),
  segmentWriteKey: getEnvironmentVariable('REACT_APP_SEGMENT_WRITE_KEY'),
  environment: getEnvironmentVariable('NODE_ENV'),
};
