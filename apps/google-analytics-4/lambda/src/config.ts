function getEnvironmentVariable(environmentVariableName: string) {
  const environmentVariableValue = process.env[environmentVariableName];
  if (environmentVariableValue === undefined) {
    console.log(process.env);
    throw new Error(`Missing environment variable: '${environmentVariableName}'`);
  }
  return environmentVariableValue;
}

export const config = {
  signingSecret: getEnvironmentVariable('SIGNING_SECRET'),
  stage: getEnvironmentVariable('STAGE'),
};
