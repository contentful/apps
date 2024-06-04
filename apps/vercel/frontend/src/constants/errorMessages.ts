export const errorMessages = {
  invalidToken: 'Invalid access token.',
  invalidTeamScope: 'Token is not scoped to a team.',
  expiredToken: 'Token has expired.',
  projectNotFound:
    'The project you have configured is no longer available. Please select another one.',
  cannotFetchProjects: 'We had trouble fetching your Vercel projects.',
  // placeholder error message for now until implement manual fix for this.
  invalidProjectSettings:
    'The settings that allow live preview of your Vercel project within Contentful are invalid. Please ensure bypass protection is enabled. ',
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
