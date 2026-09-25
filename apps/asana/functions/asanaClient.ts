import type { AppActionRequest, FunctionEventContext } from '@contentful/node-apps-toolkit';
import type {
  AsanaComment,
  AsanaProject,
  AsanaTask,
  AsanaTaskOption,
  AsanaUserOption,
  AsanaWorkspace,
} from '../src/types';
import { VALIDATION_MESSAGES } from '../src/const';
import { getOAuthSdk } from './initiateOauth';

type AsanaEnvelope<TData> = {
  data?: TData;
  errors?: Array<{ message?: string }>;
  next_page?: {
    path?: string | null;
  } | null;
};

function getAsanaErrorMessage<TData>(response: AsanaEnvelope<TData>) {
  return response.errors
    ?.map((error) => error.message)
    .filter(Boolean)
    .join(', ');
}

export async function getAsanaAccessToken(
  _event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<string> {
  const sdk = getOAuthSdk(context);

  try {
    const token = await sdk.token();
    return token.accessToken;
  } catch {
    // sdk.token() throws when the current user hasn't connected Asana yet.
    return '';
  }
}

export async function callAsana<TData>(
  path: string,
  accessToken: string,
  init?: RequestInit
): Promise<TData> {
  const requestUrl = path.startsWith('https://app.asana.com/api/1.0')
    ? path
    : `https://app.asana.com/api/1.0${path}`;

  const response = await fetch(requestUrl, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    body: init?.body,
  });

  const body = (await response.json()) as AsanaEnvelope<TData>;
  if (!response.ok) {
    throw new Error(getAsanaErrorMessage(body) || VALIDATION_MESSAGES.invalidCredentials);
  }

  if (!body.data) {
    throw new Error('Asana returned an unexpected response.');
  }

  return body.data;
}

async function callAsanaList<TData>(path: string, accessToken: string): Promise<TData[]> {
  const items: TData[] = [];
  let nextPath: string | null = path;

  while (nextPath) {
    const requestUrl = nextPath.startsWith('https://app.asana.com/api/1.0')
      ? nextPath
      : `https://app.asana.com/api/1.0${nextPath}`;

    const response = await fetch(requestUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    const body = (await response.json()) as AsanaEnvelope<TData[]>;
    if (!response.ok) {
      throw new Error(getAsanaErrorMessage(body) || VALIDATION_MESSAGES.invalidCredentials);
    }

    items.push(...(body.data ?? []));
    nextPath = body.next_page?.path ?? null;
  }

  return items;
}

export async function getWorkspaces(accessToken: string): Promise<AsanaWorkspace[]> {
  return callAsanaList<AsanaWorkspace>('/workspaces?opt_fields=gid,name&limit=100', accessToken);
}

export async function getProjects(
  accessToken: string,
  workspaceGid: string
): Promise<AsanaProject[]> {
  const projects = await callAsanaList<AsanaProject>(
    `/workspaces/${workspaceGid}/projects?opt_fields=gid,name&limit=100`,
    accessToken
  );

  return projects.sort((left, right) => left.name.localeCompare(right.name));
}

type AsanaTypeaheadResult = {
  gid: string;
  name: string;
  resource_type?: string;
  email?: string;
};

export async function searchProjects(
  accessToken: string,
  workspaceGid: string,
  query: string
): Promise<AsanaProject[]> {
  const params = new URLSearchParams({
    resource_type: 'project',
    count: query.trim() ? '50' : '20',
    opt_fields: 'gid,name,resource_type',
  });

  if (query.trim()) {
    params.set('query', query.trim());
  }

  const results = await callAsana<AsanaTypeaheadResult[]>(
    `/workspaces/${workspaceGid}/typeahead?${params.toString()}`,
    accessToken
  );

  return results
    .filter((item) => !item.resource_type || item.resource_type === 'project')
    .map((item) => ({ gid: item.gid, name: item.name }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function searchTasks(
  accessToken: string,
  workspaceGid: string,
  query: string
): Promise<AsanaTaskOption[]> {
  const params = new URLSearchParams({
    resource_type: 'task',
    count: query.trim() ? '20' : '10',
    opt_fields: 'gid,name,resource_type',
  });

  if (query.trim()) {
    params.set('query', query.trim());
  }

  const results = await callAsana<AsanaTypeaheadResult[]>(
    `/workspaces/${workspaceGid}/typeahead?${params.toString()}`,
    accessToken
  );

  return results
    .filter((item) => !item.resource_type || item.resource_type === 'task')
    .map((item) => ({ gid: item.gid, name: item.name }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function searchUsers(
  accessToken: string,
  workspaceGid: string,
  query: string
): Promise<AsanaUserOption[]> {
  const params = new URLSearchParams({
    resource_type: 'user',
    count: query.trim() ? '20' : '10',
    opt_fields: 'gid,name,email,resource_type',
  });

  if (query.trim()) {
    params.set('query', query.trim());
  }

  const results = await callAsana<AsanaTypeaheadResult[]>(
    `/workspaces/${workspaceGid}/typeahead?${params.toString()}`,
    accessToken
  );

  return results
    .filter((item) => !item.resource_type || item.resource_type === 'user')
    .map((item) => ({
      gid: item.gid,
      name: item.name,
      ...(item.email ? { email: item.email } : {}),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getProjectTasks(
  accessToken: string,
  projectGid: string,
  query: string
): Promise<AsanaTaskOption[]> {
  const tasks = await callAsanaList<AsanaTaskOption>(
    `/projects/${projectGid}/tasks?opt_fields=gid,name&completed_since=now&limit=100`,
    accessToken
  );

  const normalizedQuery = query.trim().toLowerCase();

  return tasks
    .filter((task) => !normalizedQuery || task.name.toLowerCase().includes(normalizedQuery))
    .sort((left, right) => left.name.localeCompare(right.name))
    .slice(0, 20);
}

type AsanaTaskRecord = {
  gid: string;
  name: string;
  permalink_url: string;
  notes?: string;
  completed?: boolean;
  due_on?: string | null;
  assignee?: {
    gid?: string;
    name?: string;
  } | null;
  dependencies?: Array<{ gid: string; name?: string }>;
  workspace?: {
    gid?: string;
  } | null;
};

type CreateTaskPayload = {
  name: string;
  notes?: string;
  projects?: string[];
  workspace?: string;
};

type UpdateTaskPayload = {
  name?: string;
  notes?: string;
  completed?: boolean;
  assignee?: string | null;
  due_on?: string | null;
};

const TASK_OPT_FIELDS =
  'gid,name,permalink_url,notes,completed,due_on,assignee.gid,assignee.name,dependencies.gid,dependencies.name,workspace.gid';

export async function createTask(
  accessToken: string,
  payload: CreateTaskPayload
): Promise<AsanaTaskRecord> {
  return callAsana<AsanaTaskRecord>(`/tasks?opt_fields=${TASK_OPT_FIELDS}`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ data: payload }),
  });
}

// Asana's task API doesn't always expand `dependencies.name` (dependencies are returned as
// bare gids when the requesting user only has partial visibility into the referenced task), so
// any dependency missing a name is resolved with an individual lookup.
async function resolveDependencyNames(
  accessToken: string,
  dependencies: Array<{ gid: string; name?: string }>
): Promise<AsanaTaskOption[]> {
  return Promise.all(
    dependencies.map(async (dependency) => {
      if (typeof dependency.name === 'string' && dependency.name.trim()) {
        return { gid: dependency.gid, name: dependency.name };
      }

      try {
        const dependencyTask = await callAsana<{ gid: string; name?: string }>(
          `/tasks/${dependency.gid}?opt_fields=gid,name`,
          accessToken
        );
        return { gid: dependency.gid, name: dependencyTask.name?.trim() || dependency.gid };
      } catch {
        return { gid: dependency.gid, name: dependency.gid };
      }
    })
  );
}

async function mapAsanaTask(
  accessToken: string,
  task: AsanaTaskRecord
): Promise<AsanaTask & { completed?: boolean }> {
  return {
    gid: task.gid,
    name: task.name,
    permalinkUrl: task.permalink_url,
    ...(typeof task.notes === 'string' ? { description: task.notes } : {}),
    ...(typeof task.completed === 'boolean'
      ? {
          completed: task.completed,
          status: task.completed ? 'Completed' : 'Open',
        }
      : {}),
    ...(typeof task.assignee?.name === 'string' ? { assigneeName: task.assignee.name } : {}),
    ...(typeof task.assignee?.gid === 'string' ? { assigneeGid: task.assignee.gid } : {}),
    ...(typeof task.due_on === 'string' ? { dueDate: task.due_on } : {}),
    ...(Array.isArray(task.dependencies)
      ? { dependencies: await resolveDependencyNames(accessToken, task.dependencies) }
      : {}),
    ...(typeof task.workspace?.gid === 'string' ? { workspaceGid: task.workspace.gid } : {}),
  };
}

export function extractTaskGid(taskIdOrUrl?: string) {
  const trimmedValue = taskIdOrUrl?.trim() ?? '';
  if (!trimmedValue) {
    return '';
  }

  const urlMatch = trimmedValue.match(/\/task\/(\d+)/);
  if (urlMatch) {
    return urlMatch[1];
  }

  const gidMatch = trimmedValue.match(/^\d+$/);
  return gidMatch ? gidMatch[0] : '';
}

export async function updateTask(
  accessToken: string,
  taskGid: string,
  payload: UpdateTaskPayload
): Promise<AsanaTask & { completed?: boolean }> {
  const task = await callAsana<AsanaTaskRecord>(
    `/tasks/${taskGid}?opt_fields=${TASK_OPT_FIELDS}`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify({ data: payload }),
    }
  );

  return mapAsanaTask(accessToken, task);
}

export async function getTask(
  accessToken: string,
  taskGid: string
): Promise<AsanaTask & { completed?: boolean }> {
  const task = await callAsana<AsanaTaskRecord>(
    `/tasks/${taskGid}?opt_fields=${TASK_OPT_FIELDS}`,
    accessToken
  );

  return mapAsanaTask(accessToken, task);
}

export async function addTaskDependency(
  accessToken: string,
  taskGid: string,
  dependencyGid: string
): Promise<void> {
  await callAsana<Record<string, unknown>>(`/tasks/${taskGid}/addDependencies`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ data: { dependencies: [dependencyGid] } }),
  });
}

export async function removeTaskDependency(
  accessToken: string,
  taskGid: string,
  dependencyGid: string
): Promise<void> {
  await callAsana<Record<string, unknown>>(`/tasks/${taskGid}/removeDependencies`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ data: { dependencies: [dependencyGid] } }),
  });
}

export async function addCommentToTask(
  accessToken: string,
  taskGid: string,
  comment: string
): Promise<void> {
  await callAsana<Record<string, unknown>>(`/tasks/${taskGid}/stories`, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      data: {
        text: comment,
      },
    }),
  });
}

type AsanaStoryRecord = {
  gid: string;
  text?: string;
  created_at?: string;
  resource_subtype?: string;
  created_by?: {
    name?: string;
  } | null;
};

export async function getTaskComments(
  accessToken: string,
  taskGid: string
): Promise<AsanaComment[]> {
  const stories = await callAsanaList<AsanaStoryRecord>(
    `/tasks/${taskGid}/stories?opt_fields=gid,text,created_at,resource_subtype,created_by.name&limit=100`,
    accessToken
  );

  return stories
    .filter((story) => story.resource_subtype === 'comment_added' && typeof story.text === 'string')
    .map((story) => ({
      gid: story.gid,
      text: story.text ?? '',
      authorName: story.created_by?.name?.trim() || 'Unknown',
      createdAt: story.created_at ?? '',
    }));
}
