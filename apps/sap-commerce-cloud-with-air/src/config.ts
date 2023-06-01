/* eslint-disable @typescript-eslint/no-unused-vars */
function getEnvironmentVariable(environmentVariableName: string) {
  const environmentVariableValue = process.env[environmentVariableName];
  if (environmentVariableValue === undefined) {
    throw new Error(`Missing environment variable: '${environmentVariableName}'`);
  }
  return environmentVariableValue;
}

export const config = {
  isTestEnv: getEnvironmentVariable('REACT_APP_ENV') === 'development',
};
