export const errorMessages = {
  invalidToken: 'Invalid access token.',
  invalidTeamScope: 'Token is not scoped to a team.',
  expiredToken: 'Token has expired.',
  projectNotFound:
    'The project you have configured is no longer available. Please select another one.',
  cannotFetchProjects: 'We had trouble fetching your Vercel projects.',
  apiPathNotFound:
    'The path you have configured is no longer available. Please select another one.',
  apiPathsEmpty: "It looks like you haven't configured any routes yet.",
  cannotFetchApiPaths: 'We had trouble fetching routes for this Vercel project.',
  invalidPreviewPathFormat: 'Path must start with a "/", and include a {token}.',
  emptyPreviewPathInput: 'Field is empty.',
};
