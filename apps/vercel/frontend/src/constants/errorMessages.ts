export const errorMessages = {
  invalidToken: 'Invalid access token.',
  invalidContentfulPreviewSecret: 'Invalid Contentful preview secret.',
  environmentVariableAlreadyExists: (key: string) =>
    `An environment variable with key of ${key} already exists.`,
  cannotFetchVercelEnvVars:
    'We had trouble fetching environment variables for this Vercel project.',
  invalidTeamScope: 'Token is not scoped to a team.',
  expiredToken: 'Token has expired.',
  projectNotFound:
    'The project you have configured is no longer available. Please select another one.',
  cannotFetchProjects: 'We had trouble fetching your Vercel projects.',
  apiPathNotFound:
    'The route you previously selected is no longer available. Please select another one.',
  apiPathsEmpty: "It looks like your Vercel project doesn't have any routes configured yet.",
  cannotFetchApiPaths: 'We had trouble fetching routes for this Vercel project.',
  invalidPreviewPathFormat: 'Path must start with a "/", and include a {token}.',
  emptyPreviewPathInput: 'Field is empty.',
  invalidDeploymentData: 'We had trouble fetching routes for this Vercel project.',
  invalidSpaceId: (spaceId: string) =>
    `It looks like you’ve configured an environment variable, CONTENTFUL_SPACE_ID, in the selected Vercel project that doesn’t match the current id of the space, ${spaceId}, where this app is installed.`,
};
