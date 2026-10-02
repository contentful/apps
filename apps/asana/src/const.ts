export const VALIDATION_MESSAGES = {
  tokenRequired:
    'Connect this app to Asana in the Sidebar, or add an Asana API key in the app configuration screen, to use this action.',
  saveRequired: 'Please fill in the required fields before saving.',
  saveFailed: 'Configuration could not be saved.',
  connectionRequired: 'Connect to Asana, or add an Asana API key, before saving.',
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
  sectionsFailed: 'Could not load Asana sections.',
  commentsFailed: 'Could not load Asana comments.',
  subtasksFailed: 'Could not load Asana subtasks.',
  customFieldRequired: 'Provide a custom field to update.',
  customFieldInvalidValue: 'Provide a valid value for the custom field.',
  customFieldUpdated: 'Asana custom field updated successfully.',
  customFieldUpdateFailed: 'Could not update the Asana custom field.',
  taskTitleRequired: 'Enter an Asana task title.',
  taskIdRequired: 'Enter an Asana task GID or Asana task URL.',
  entryIdRequired: 'Provide the Contentful entry ID to sync.',
  entryNotLinked: 'No Asana task is linked to this entry yet. Create one first.',
  taskUpdateFieldsRequired: 'Provide at least one task field to update.',
  taskDestinationRequired:
    'Provide an Asana project or workspace, or configure a default destination first.',
  taskCreated: 'Asana task created successfully.',
  taskCreateFailed: 'Could not create the Asana task.',
  taskUpdated: 'Asana task updated successfully.',
  taskUpdateFailed: 'Could not update the Asana task.',
  taskRefreshFailed:
    'Your change was saved to Asana, but the updated task details could not be loaded back. This usually means one of this task\u2019s custom fields has invalid data in Asana (for example, a deleted or duplicate option) \u2014 check its custom fields in Asana directly.',
  taskCommentRequired: 'Enter a comment before posting to Asana.',
  taskCommentAdded: 'Asana comment added successfully.',
  taskCommentFailed: 'Could not add the Asana comment.',
  taskNotFound: 'This Asana task no longer exists.',
  taskUnlinkedDeleted:
    'The linked Asana task no longer exists in Asana, so it was unlinked from this entry.',
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
  lastAutosaveCommentAt: 'lastAutosaveCommentAt',
  isPrimary: 'isPrimary',
} as const;

// Settings for the "post a comment in Asana when a linked entry is autosaved" app event handler.
// Autosave fires per-field-blur, not per-keystroke, but a single editing session can still blur
// several fields in quick succession, so a cooldown prevents one comment per field. The cooldown
// is intentionally long (vs. a "debounce until quiet" design) because Functions/App Events only
// run in reaction to an event - there's no scheduled check to fire once editing goes quiet, so we
// comment on the first autosave of a session and then suppress further comments for the cooldown.
export const AUTOSAVE_COMMENT_CONFIG = {
  cooldownMs: 60 * 60 * 1000, // 1 hour
  commentText: 'This entry was edited in Contentful.',
} as const;
