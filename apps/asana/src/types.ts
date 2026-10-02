export enum ConnectionStatus {
  None = 'none',
  Testing = 'testing',
  Success = 'success',
  Error = 'error',
}

export interface AppInstallationParameters {
  defaultWorkspaceGid: string;
  defaultWorkspaceName: string;
  defaultProjectGid: string;
  defaultProjectName: string;
  enabledContentTypeIds?: string[];
  // Optional shared Asana Personal Access Token, used as a fallback token source for calls that
  // have no connected-user OAuth session available (Automations, App Event Handlers). Per-user
  // OAuth (Sidebar "Connect to Asana") is tried first; this is only used when that fails.
  asanaApiKey?: string;
}

export interface AsanaWorkspace {
  gid: string;
  name: string;
}

export interface AsanaProject {
  gid: string;
  name: string;
}

export interface AsanaSection {
  gid: string;
  name: string;
}

export interface AsanaCustomFieldOption {
  gid: string;
  name: string;
}

// A custom field's current value on a specific task. Only the value key matching `type` is
// populated (e.g. a `text` field only sets `textValue`), mirroring Asana's own task response shape.
export interface AsanaCustomFieldValue {
  gid: string;
  name: string;
  type: string;
  enumOptions?: AsanaCustomFieldOption[];
  textValue?: string;
  numberValue?: number;
  // Decimal places Asana expects for this number field (e.g. 2 for a currency-formatted field).
  precision?: number;
  enumValue?: AsanaCustomFieldOption | null;
  multiEnumValues?: AsanaCustomFieldOption[];
  dateValue?: string;
  peopleValue?: AsanaUserOption[];
  displayValue?: string;
}

export interface UpdateAsanaCustomFieldRequest {
  taskId?: string;
  // Contentful entry ID. Used to look up the linked Asana task when an automation trigger only
  // has the entry (not a task GID/URL) available. Ignored if taskId is also provided.
  entryId?: string;
  fieldGid?: string;
  fieldType?: string;
  // JSON-encoded value shaped for `fieldType` (e.g. a gid string for enum, an array of gids for
  // multi_enum/people, `{ date: 'YYYY-MM-DD' }` for date, or null to clear the field).
  value?: string;
}

export type UpdateAsanaCustomFieldResponse = Record<string, unknown> & {
  success: boolean;
  message: string;
  task?: AsanaTask & { completed?: boolean };
};

export type AsanaTaskOption = {
  gid: string;
  name: string;
};

export type AsanaUserOption = {
  gid: string;
  name: string;
  email?: string;
};

export interface ContentTypeOption {
  id: string;
  name: string;
}

export interface AsanaTask {
  gid: string;
  name: string;
  permalinkUrl: string;
  description?: string;
  status?: string;
  assigneeName?: string;
  assigneeGid?: string;
  dueDate?: string;
  dependencies?: AsanaTaskOption[];
  workspaceGid?: string;
  projectGid?: string;
  sectionGid?: string;
  sectionName?: string;
  customFields?: AsanaCustomFieldValue[];
  createdAt?: string;
  modifiedAt?: string;
  tags?: AsanaTaskOption[];
}

export interface PrimaryAsanaTaskLink {
  entryId: string;
  taskGid: string;
  taskUrl: string;
  taskName: string;
  taskDescription?: string;
  status?: string;
  assigneeName?: string;
  dueDate?: string;
  lastSyncedAt?: string;
  lastAutosaveCommentAt?: string;
}

// An entry can have one primary task link (the one automations resolve via entryId) plus any
// number of additional, secondary links. `linkEntryId` is the sys.id of the underlying
// "Asana Integration (do not delete)" entry backing this specific link, needed to manage/unlink
// a given task when an entry has more than one.
export interface AsanaTaskLink extends PrimaryAsanaTaskLink {
  linkEntryId: string;
  isPrimary: boolean;
}

export interface PrimaryAsanaTaskLinkValue {
  taskGid?: string;
  taskUrl?: string;
  taskName?: string;
  taskDescription?: string;
  status?: string;
  assigneeName?: string;
  dueDate?: string;
  lastSyncedAt?: string;
  lastAutosaveCommentAt?: string;
}

export interface CreateAsanaTaskRequest {
  title?: string;
  notes?: string;
  entryId?: string;
  titleFieldId?: string;
  projectGid?: string;
  workspaceGid?: string;
}

export interface UpdateAsanaTaskRequest {
  taskId?: string;
  // Contentful entry ID. Used to look up the linked Asana task when an automation trigger only
  // has the entry (not a task GID/URL) available. Ignored if taskId is also provided.
  entryId?: string;
  title?: string;
  notes?: string;
  completed?: boolean;
  assignee?: string;
  dueDate?: string;
  // Dependency task GID to add or remove. Prefix with "-" to remove (e.g. "-1234").
  dependencyGid?: string;
  sectionGid?: string;
}

export interface GetAsanaTaskRequest {
  taskId?: string;
}

export interface AddAsanaCommentRequest {
  taskId?: string;
  // Contentful entry ID. Used to look up the linked Asana task when an automation trigger only
  // has the entry (not a task GID/URL) available. Ignored if taskId is also provided.
  entryId?: string;
  comment?: string;
}

export type AsanaComment = {
  gid: string;
  text: string;
  authorName: string;
  createdAt: string;
};

export interface GetAsanaCommentsRequest {
  taskId?: string;
}

export interface GetAsanaSectionsRequest {
  projectGid?: string;
}

export type AsanaSubtask = {
  gid: string;
  name: string;
  completed: boolean;
  permalinkUrl: string;
  assigneeName?: string;
  dueDate?: string;
};

export interface GetAsanaSubtasksRequest {
  taskId?: string;
}

export type GetAsanaSubtasksResponse = Record<string, unknown> & {
  success: boolean;
  message: string;
  subtasks?: AsanaSubtask[];
};

export type ValidateAsanaCredentialsResponse = Record<string, unknown> & {
  valid: boolean;
  message: string;
};

export type InitiateAsanaOAuthResponse = Record<string, unknown> & {
  authorizationUrl: string;
};

export type CompleteAsanaOAuthResponse = Record<string, unknown> & {
  success: boolean;
  message: string;
};

export type DisconnectAsanaResponse = Record<string, unknown> & {
  success: boolean;
  message: string;
};

export type CheckAsanaStatusResponse = Record<string, unknown> & {
  connected: boolean;
};

export type GetAsanaWorkspacesResponse = Record<string, unknown> & {
  workspaces: AsanaWorkspace[];
};

export type GetAsanaProjectsResponse = Record<string, unknown> & {
  projects: AsanaProject[];
};

export type GetAsanaSectionsResponse = Record<string, unknown> & {
  success: boolean;
  message: string;
  sections?: AsanaSection[];
};

export type GetAsanaTasksResponse = Record<string, unknown> & {
  tasks: AsanaTaskOption[];
};

export type GetAsanaUsersResponse = Record<string, unknown> & {
  users: AsanaUserOption[];
};

export type CreateAsanaTaskResponse = Record<string, unknown> & {
  success: boolean;
  message: string;
  task?: AsanaTask;
  projectGid?: string;
  workspaceGid?: string;
  entryLinked?: boolean;
};

export type UpdateAsanaTaskResponse = Record<string, unknown> & {
  success: boolean;
  message: string;
  task?: AsanaTask & {
    completed?: boolean;
  };
};

export type GetAsanaTaskResponse = Record<string, unknown> & {
  success: boolean;
  message: string;
  task?: AsanaTask & {
    completed?: boolean;
  };
  // Set when the Asana task no longer exists (deleted in Asana). Callers should treat this as a
  // signal to unlink the task from the Contentful entry rather than surfacing a generic error.
  taskDeleted?: boolean;
};

export type AddAsanaCommentResponse = Record<string, unknown> & {
  success: boolean;
  message: string;
};

export type GetAsanaCommentsResponse = Record<string, unknown> & {
  success: boolean;
  message: string;
  comments?: AsanaComment[];
};

export interface TaskDetailsDialogParameters {
  taskGid: string;
  taskName: string;
  taskUrl: string;
  taskDescription?: string;
  status?: string;
  assigneeName?: string;
  dueDate?: string;
  workspaceGid?: string;
  dependencies?: AsanaTaskOption[];
  projectGid?: string;
  sectionGid?: string;
  sectionName?: string;
  customFields?: AsanaCustomFieldValue[];
  createdAt?: string;
  modifiedAt?: string;
  tags?: AsanaTaskOption[];
}

export interface TaskDetailsDialogResult {
  updatedTask?: AsanaTask & {
    completed?: boolean;
  };
  unlinked?: boolean;
}
