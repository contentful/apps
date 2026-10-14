export enum ConnectionStatus {
  None = 'none',
  Testing = 'testing',
  Success = 'success',
  Error = 'error',
}

export interface AppInstallationParameters {
  personalAccessToken: string;
  defaultWorkspaceGid: string;
  defaultWorkspaceName: string;
  defaultProjectGid: string;
  defaultProjectName: string;
  enabledContentTypeIds?: string[];
  primaryTaskLinkMappings?: Record<string, PrimaryTaskLinkFieldMapping>;
  connectionStatus?: ConnectionStatus;
  connectionMessage?: string;
}

export interface AsanaWorkspace {
  gid: string;
  name: string;
}

export interface AsanaProject {
  gid: string;
  name: string;
}

export interface AsanaTaskOption {
  gid: string;
  name: string;
}

export interface ContentTypeOption {
  id: string;
  name: string;
  fields: ContentTypeFieldOption[];
}

export interface ContentTypeFieldOption {
  id: string;
  name: string;
  type: string;
}

export interface PrimaryTaskLinkFieldMapping {
  objectFieldId?: string;
  taskGidFieldId?: string;
  taskUrlFieldId?: string;
  taskNameFieldId?: string;
}

export interface AsanaTask {
  gid: string;
  name: string;
  permalinkUrl: string;
  description?: string;
  status?: string;
  assigneeName?: string;
  dueDate?: string;
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
}

export interface CreateAsanaTaskRequest {
  title?: string;
  notes?: string;
  entryId?: string;
  titleFieldId?: string;
  projectGid?: string;
  workspaceGid?: string;
  personalAccessToken?: string;
}

export interface UpdateAsanaTaskRequest {
  taskId?: string;
  title?: string;
  notes?: string;
  completed?: boolean;
  personalAccessToken?: string;
}

export interface GetAsanaTaskRequest {
  taskId?: string;
  personalAccessToken?: string;
}

export interface AddAsanaCommentRequest {
  taskId?: string;
  comment?: string;
  personalAccessToken?: string;
}

export type ValidateAsanaCredentialsResponse = Record<string, unknown> & {
  valid: boolean;
  message: string;
};

export type GetAsanaWorkspacesResponse = Record<string, unknown> & {
  workspaces: AsanaWorkspace[];
};

export type GetAsanaProjectsResponse = Record<string, unknown> & {
  projects: AsanaProject[];
};

export type GetAsanaTasksResponse = Record<string, unknown> & {
  tasks: AsanaTaskOption[];
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
};

export type AddAsanaCommentResponse = Record<string, unknown> & {
  success: boolean;
  message: string;
};

export interface TaskDetailsDialogParameters {
  taskGid: string;
  taskName: string;
  taskUrl: string;
  taskDescription?: string;
  status?: string;
  assigneeName?: string;
  dueDate?: string;
}

export interface TaskDetailsDialogResult {
  updatedTask?: AsanaTask & {
    completed?: boolean;
  };
  unlinked?: boolean;
}
