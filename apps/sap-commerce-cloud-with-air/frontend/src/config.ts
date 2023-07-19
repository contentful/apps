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
  proxyUrl: getEnvironmentVariable('REACT_APP_PROXY_API_URL'),
  isTestEnv: getEnvironmentVariable('REACT_APP_ENV') === 'development',
};
