type EnvironmentVariable = string | null | number | undefined;
interface ImportMetaEnv {
  [key: string]: string;
}
interface ImportMetaData extends ImportMeta {
  env: ImportMetaEnv;
}

function getEnvironmentVariable(
  environmentVariableName: string,
  fallback?: EnvironmentVariable
): string {
  const environmentVariableValue = (import.meta as ImportMetaData).env[environmentVariableName];
  if (!environmentVariableValue) {
    if (fallback) return fallback.toString();
    throw new Error(`Missing environment variable: '${environmentVariableName}'`);
  }
  return environmentVariableValue;
}

export const config = {
  backendApiUrl: getEnvironmentVariable('VITE_BACKEND_API_URL'),
  version: getEnvironmentVariable('VITE_VERSION', 'no-version-set'),
  release: getEnvironmentVariable('VITE_RELEASE', 'no-release-hash-set'),
  sentryDSN: getEnvironmentVariable('VITE_SENTRY_DSN'),
  segmentWriteKey: getEnvironmentVariable('VITE_SEGMENT_WRITE_KEY'),
  environment: getEnvironmentVariable('VITE_NODE_ENV'),
};
