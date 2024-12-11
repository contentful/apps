type EnvironmentVariable = string | null | number | undefined;

function getEnvironmentVariable(
  environmentVariableName: string,
  fallback?: EnvironmentVariable
): string {
  // @ts-ignore
  const environmentVariableValue = import.meta.env[environmentVariableName];
  if (!environmentVariableValue) {
    if (fallback) return fallback.toString();
    throw new Error(`Missing environment variable: '${environmentVariableName}'`);
  }
  return environmentVariableValue;
}

const backendApiUrl =
  getEnvironmentVariable('VITE_ENV', 'prod') === 'test'
    ? getEnvironmentVariable('VITE_BACKEND_API_URL_TEST')
    : getEnvironmentVariable('VITE_BACKEND_API_URL');

export const config = {
  backendApiUrl,
  version: getEnvironmentVariable('VITE_VERSION', 'no-version-set'),
  release: getEnvironmentVariable('VITE_RELEASE', 'no-release-hash-set'),
  sentryDSN: getEnvironmentVariable('VITE_SENTRY_DSN'),
  segmentWriteKey: getEnvironmentVariable('VITE_SEGMENT_WRITE_KEY'),
  environment: getEnvironmentVariable('NODE_ENV'),
};
