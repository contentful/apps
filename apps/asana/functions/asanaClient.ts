import type { AppActionRequest, FunctionEventContext } from '@contentful/node-apps-toolkit';
import type {
  AppInstallationParameters,
  AsanaProject,
  AsanaTask,
  AsanaTaskOption,
  AsanaWorkspace,
} from '../src/types';
import { VALIDATION_MESSAGES } from '../src/const';

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

type AsanaOAuthTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

async function requestAsanaOAuthToken(
  body: Record<string, string>
): Promise<AsanaOAuthTokenResponse> {
  const response = await fetch('https://app.asana.com/-/oauth_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });

  const payload = (await response.json()) as AsanaOAuthTokenResponse;
  if (!response.ok) {
    throw new Error(
      payload.error_description || payload.error || VALIDATION_MESSAGES.invalidCredentials
    );
  }

  return payload;
}

export async function exchangeAuthorizationCode(params: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
}): Promise<{ accessToken: string; refreshToken: string }> {
  const token = await requestAsanaOAuthToken({
    grant_type: 'authorization_code',
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    code: params.code,
    code_verifier: params.codeVerifier,
  });

  if (!token.refresh_token) {
    throw new Error('Asana did not return a refresh token for this authorization code.');
  }

  return { accessToken: token.access_token, refreshToken: token.refresh_token };
}

export async function getAsanaAccessTokenFromParameters(
  installationParameters?: Partial<AppInstallationParameters>
): Promise<string> {
  const clientId = installationParameters?.oauthClientId?.trim();
  const clientSecret = installationParameters?.oauthClientSecret?.trim();
  const redirectUri = installationParameters?.oauthRedirectUri?.trim();
  const refreshToken = installationParameters?.oauthRefreshToken?.trim();

  if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
    return '';
  }

  try {
    const token = await requestAsanaOAuthToken({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      refresh_token: refreshToken,
    });
    return token.access_token;
  } catch {
    return '';
  }
}

export async function getAsanaAccessToken(
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<string> {
  const requestBody = event.body as { accessToken?: string } | undefined;
  if (requestBody?.accessToken?.trim()) {
    return requestBody.accessToken.trim();
  }

  return getAsanaAccessTokenFromParameters(
    context.appInstallationParameters as Partial<AppInstallationParameters> | undefined
  );
}

export async function callAsana<TData>(
  path: string,
  personalAccessToken: string,
  init?: RequestInit
): Promise<TData> {
  const requestUrl = path.startsWith('https://app.asana.com/api/1.0')
    ? path
    : `https://app.asana.com/api/1.0${path}`;

  const response = await fetch(requestUrl, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${personalAccessToken}`,
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

async function callAsanaList<TData>(path: string, personalAccessToken: string): Promise<TData[]> {
  const items: TData[] = [];
  let nextPath: string | null = path;

  while (nextPath) {
    const requestUrl = nextPath.startsWith('https://app.asana.com/api/1.0')
      ? nextPath
      : `https://app.asana.com/api/1.0${nextPath}`;

    const response = await fetch(requestUrl, {
      headers: {
        Authorization: `Bearer ${personalAccessToken}`,
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

export async function getWorkspaces(personalAccessToken: string): Promise<AsanaWorkspace[]> {
  return callAsanaList<AsanaWorkspace>(
    '/workspaces?opt_fields=gid,name&limit=100',
    personalAccessToken
  );
}

export async function getProjects(
  personalAccessToken: string,
  workspaceGid: string
): Promise<AsanaProject[]> {
  const projects = await callAsanaList<AsanaProject>(
    `/workspaces/${workspaceGid}/projects?opt_fields=gid,name&limit=100`,
    personalAccessToken
  );

  return projects.sort((left, right) => left.name.localeCompare(right.name));
}

type AsanaTypeaheadResult = {
  gid: string;
  name: string;
  resource_type?: string;
};

export async function searchProjects(
  personalAccessToken: string,
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
    personalAccessToken
  );

  return results
    .filter((item) => !item.resource_type || item.resource_type === 'project')
    .map((item) => ({ gid: item.gid, name: item.name }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function searchTasks(
  personalAccessToken: string,
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
    personalAccessToken
  );

  return results
    .filter((item) => !item.resource_type || item.resource_type === 'task')
    .map((item) => ({ gid: item.gid, name: item.name }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getProjectTasks(
  personalAccessToken: string,
  projectGid: string,
  query: string
): Promise<AsanaTaskOption[]> {
  const tasks = await callAsanaList<AsanaTaskOption>(
    `/projects/${projectGid}/tasks?opt_fields=gid,name&completed_since=now&limit=100`,
    personalAccessToken
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
    name?: string;
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
};

export async function createTask(
  personalAccessToken: string,
  payload: CreateTaskPayload
): Promise<AsanaTaskRecord> {
  return callAsana<AsanaTaskRecord>(
    '/tasks?opt_fields=gid,name,permalink_url,notes,completed,due_on,assignee.name',
    personalAccessToken,
    {
      method: 'POST',
      body: JSON.stringify({ data: payload }),
    }
  );
}

function mapAsanaTask(task: AsanaTaskRecord): AsanaTask & { completed?: boolean } {
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
    ...(typeof task.due_on === 'string' ? { dueDate: task.due_on } : {}),
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
  personalAccessToken: string,
  taskGid: string,
  payload: UpdateTaskPayload
): Promise<AsanaTask & { completed?: boolean }> {
  const task = await callAsana<AsanaTaskRecord>(
    `/tasks/${taskGid}?opt_fields=gid,name,permalink_url,notes,completed,due_on,assignee.name`,
    personalAccessToken,
    {
      method: 'PUT',
      body: JSON.stringify({ data: payload }),
    }
  );

  return mapAsanaTask(task);
}

export async function getTask(
  personalAccessToken: string,
  taskGid: string
): Promise<AsanaTask & { completed?: boolean }> {
  const task = await callAsana<AsanaTaskRecord>(
    `/tasks/${taskGid}?opt_fields=gid,name,permalink_url,notes,completed,due_on,assignee.name`,
    personalAccessToken
  );

  return mapAsanaTask(task);
}

export async function addCommentToTask(
  personalAccessToken: string,
  taskGid: string,
  comment: string
): Promise<void> {
  await callAsana<Record<string, unknown>>(`/tasks/${taskGid}/stories`, personalAccessToken, {
    method: 'POST',
    body: JSON.stringify({
      data: {
        text: comment,
      },
    }),
  });
}
