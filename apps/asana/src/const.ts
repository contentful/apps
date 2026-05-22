export const VALIDATION_MESSAGES = {
  tokenRequired: 'Enter a valid Asana personal access token.',
  saveRequired: 'Please fill in the required fields before saving.',
  saveFailed: 'Configuration could not be saved.',
  connectionRequired: 'Please enter an Asana personal access token before testing the connection.',
  installRequired: 'Please install the app before testing the connection.',
  validCredentials: 'Your Asana token is valid.',
  invalidCredentials: 'Asana authentication failed. Check your token and try again.',
  workspacesFailed: 'Could not load Asana workspaces.',
  projectsFailed: 'Could not load Asana projects.',
  taskTitleRequired: 'Enter an Asana task title.',
  taskIdRequired: 'Enter an Asana task GID or Asana task URL.',
  taskUpdateFieldsRequired: 'Provide at least one task field to update.',
  taskDestinationRequired:
    'Provide an Asana project or workspace, or configure a default destination first.',
  taskCreated: 'Asana task created successfully.',
  taskCreateFailed: 'Could not create the Asana task.',
  taskUpdated: 'Asana task updated successfully.',
  taskUpdateFailed: 'Could not update the Asana task.',
  taskCommentRequired: 'Enter a comment before posting to Asana.',
  taskCommentAdded: 'Asana comment added successfully.',
  taskCommentFailed: 'Could not add the Asana comment.',
};

export const ASANA_AUTOMATION_CONFIG = {
  contentTypeId: 'asanaTaskRequest',
  statusFieldId: 'status',
  readyStatusValue: 'Ready for Asana',
  taskNameFieldId: 'taskName',
  taskNotesFieldId: 'taskNotes',
} as const;

export const PRIMARY_TASK_LINK_FIELD_IDS = {
  objectFieldId: 'asanaTaskLink',
  taskGidFieldId: 'asanaTaskGid',
  taskUrlFieldId: 'asanaTaskUrl',
  taskNameFieldId: 'asanaTaskName',
} as const;
