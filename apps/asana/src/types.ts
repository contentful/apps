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
}

export interface AsanaWorkspace {
  gid: string;
  name: string;
}

export interface AsanaProject {
  gid: string;
  name: string;
}

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
}

export interface UpdateAsanaTaskRequest {
  taskId?: string;
  title?: string;
  notes?: string;
  completed?: boolean;
  assignee?: string;
  dueDate?: string;
  addDependencyGid?: string;
  removeDependencyGid?: string;
}

export interface GetAsanaTaskRequest {
  taskId?: string;
}

export interface AddAsanaCommentRequest {
  taskId?: string;
  comment?: string;
}

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
  workspaceGid?: string;
  dependencies?: AsanaTaskOption[];
}

export interface TaskDetailsDialogResult {
  updatedTask?: AsanaTask & {
    completed?: boolean;
  };
  unlinked?: boolean;
}
