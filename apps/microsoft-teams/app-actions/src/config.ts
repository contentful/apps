type EnvironmentVariable = string | null | number | undefined;

// Defining this environmentVariables object since we need to have the explicit strings for the env vars defined
// in order to these to be defined properly in the build
const environmentVariables = {
  MSTEAMS_BOT_SERVICE_BASE_URL: process.env.MSTEAMS_BOT_SERVICE_BASE_URL,
  MSTEAMS_CLIENT_API_KEY: process.env.MSTEAMS_CLIENT_API_KEY,
};

function getEnvironmentVariable(
  environmentVariableName: keyof typeof environmentVariables,
  fallback?: EnvironmentVariable
): string {
  const environmentVariableValue = environmentVariables[environmentVariableName];
  if (!environmentVariableValue) {
    if (fallback) return fallback.toString();
    throw new Error(`Missing environment variable: '${environmentVariableName}'`);
  }
  return environmentVariableValue;
}

export const config = {
  botServiceUrl: getEnvironmentVariable('MSTEAMS_BOT_SERVICE_BASE_URL'),
  apiKey: getEnvironmentVariable('MSTEAMS_CLIENT_API_KEY'),
};
