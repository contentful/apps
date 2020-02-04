export const getEnvVarOrThrow = (envVarName: string): string => {
  if (process.env[envVarName]) {
    return process.env[envVarName]!
  } else {
    throw new Error(`${envVarName} environment variable must be set`)
  }
}
