export const VALIDATION_MESSAGES = {
  tokenRequired: 'Connect this app to Asana before using this action.',
  saveRequired: 'Please fill in the required fields before saving.',
  saveFailed: 'Configuration could not be saved.',
  connectionRequired: 'Connect to Asana before testing the connection.',
  installRequired: 'Please install the app before testing the connection.',
  popupBlocked: 'Enable popups for this site to connect to Asana.',
  validCredentials: 'Your Asana token is valid.',
  invalidCredentials: 'Asana authentication failed. Check your token and try again.',
  oauthCodeRequired: 'Missing Asana authorization details. Please try connecting again.',
  oauthConnected: 'Connected to Asana successfully.',
  oauthConnectFailed: 'Could not connect to Asana. Please try again.',
  oauthDisconnected: 'Disconnected from Asana successfully.',
  oauthDisconnectFailed: 'Could not disconnect from Asana. Please try again.',
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

export const TASK_LINK_CONTENT_TYPE_ID = 'asanaTaskLink';

export const TASK_LINK_CONTENT_TYPE_NAME = 'Asana Integration (do not delete)';

export const TASK_LINK_FIELD_IDS = {
  contentfulEntryId: 'contentfulEntryId',
  contentTypeId: 'contentTypeId',
  taskGid: 'taskGid',
  taskUrl: 'taskUrl',
  taskName: 'taskName',
  taskDescription: 'taskDescription',
  status: 'status',
  assigneeName: 'assigneeName',
  dueDate: 'dueDate',
  lastSyncedAt: 'lastSyncedAt',
} as const;
