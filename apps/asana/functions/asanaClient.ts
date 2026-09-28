import type { AppActionRequest, FunctionEventContext } from '@contentful/node-apps-toolkit';
import type {
  AsanaComment,
  AsanaCustomField,
  AsanaProject,
  AsanaSection,
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
    throw new Error(
      getAsanaErrorMessage(body) ||
        `${VALIDATION_MESSAGES.invalidCredentials} (Asana returned ${response.status})`
    );
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
      throw new Error(
        getAsanaErrorMessage(body) ||
          `${VALIDATION_MESSAGES.invalidCredentials} (Asana returned ${response.status})`
      );
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
  memberships?: Array<{
    project?: { gid?: string } | null;
    section?: { gid?: string; name?: string } | null;
  }>;
  custom_fields?: Array<{
    gid: string;
    name?: string;
    type?: string;
    enum_options?: Array<{ gid?: string; name?: string; enabled?: boolean }>;
    text_value?: string | null;
    number_value?: number | null;
    // Decimal places Asana displays/expects for this number field (e.g. 2 for a currency field
    // like "$1,000.00"). Used to round values client-side before writing them back, since Asana
    // rejects number values that don't conform to the field's configured precision.
    precision?: number | null;
    enum_value?: { gid?: string; name?: string } | null;
    multi_enum_values?: Array<{ gid?: string; name?: string }>;
    date_value?: { date?: string; date_time?: string } | null;
    people_value?: Array<{ gid?: string; name?: string }>;
    display_value?: string | null;
  }>;
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
  'gid,name,permalink_url,notes,completed,due_on,assignee.gid,assignee.name,dependencies.gid,dependencies.name,workspace.gid,memberships.project.gid,memberships.section.gid,memberships.section.name,' +
  'custom_fields.gid,custom_fields.name,custom_fields.type,custom_fields.enum_options.gid,custom_fields.enum_options.name,custom_fields.enum_options.enabled,' +
  'custom_fields.text_value,custom_fields.number_value,custom_fields.precision,custom_fields.enum_value.gid,custom_fields.enum_value.name,' +
  'custom_fields.multi_enum_values.gid,custom_fields.multi_enum_values.name,custom_fields.date_value.date,' +
  'custom_fields.people_value.gid,custom_fields.people_value.name,custom_fields.display_value';

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
    ...(() => {
      const membership = task.memberships?.find((item) => typeof item.section?.gid === 'string');
      return {
        ...(typeof membership?.project?.gid === 'string'
          ? { projectGid: membership.project.gid }
          : {}),
        ...(typeof membership?.section?.gid === 'string'
          ? { sectionGid: membership.section.gid }
          : {}),
        ...(typeof membership?.section?.name === 'string'
          ? { sectionName: membership.section.name }
          : {}),
      };
    })(),
    ...(Array.isArray(task.custom_fields)
      ? {
          customFields: task.custom_fields
            .filter((field): field is typeof field & { gid: string } => Boolean(field.gid))
            .map((field) => ({
              gid: field.gid,
              name: field.name ?? '',
              type: field.type ?? 'text',
              ...(field.enum_options
                ? {
                    enumOptions: field.enum_options
                      .filter(
                        (option): option is { gid: string; name: string; enabled?: boolean } =>
                          option.enabled !== false && Boolean(option.gid) && Boolean(option.name)
                      )
                      .map((option) => ({ gid: option.gid, name: option.name })),
                  }
                : {}),
              ...(typeof field.text_value === 'string' ? { textValue: field.text_value } : {}),
              ...(typeof field.number_value === 'number'
                ? { numberValue: field.number_value }
                : {}),
              ...(typeof field.precision === 'number' ? { precision: field.precision } : {}),
              ...(field.enum_value?.gid
                ? { enumValue: { gid: field.enum_value.gid, name: field.enum_value.name ?? '' } }
                : {}),
              ...(Array.isArray(field.multi_enum_values)
                ? {
                    multiEnumValues: field.multi_enum_values
                      .filter((option): option is { gid: string; name?: string } =>
                        Boolean(option.gid)
                      )
                      .map((option) => ({ gid: option.gid, name: option.name ?? '' })),
                  }
                : {}),
              ...(field.date_value?.date ? { dateValue: field.date_value.date } : {}),
              ...(Array.isArray(field.people_value)
                ? {
                    peopleValue: field.people_value
                      .filter((person): person is { gid: string; name?: string } =>
                        Boolean(person.gid)
                      )
                      .map((person) => ({ gid: person.gid, name: person.name ?? '' })),
                  }
                : {}),
              ...(typeof field.display_value === 'string'
                ? { displayValue: field.display_value }
                : {}),
            })),
        }
      : {}),
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

// `value` must already be shaped for `fieldType`: a gid string for enum, an array of gids for
// multi_enum/people, a number for number, a string for text, `{ date: 'YYYY-MM-DD' }` (or null)
// for date, matching what Asana's task update endpoint expects per custom field type.
export async function updateTaskCustomField(
  accessToken: string,
  taskGid: string,
  fieldGid: string,
  value: unknown
): Promise<AsanaTask & { completed?: boolean }> {
  const task = await callAsana<AsanaTaskRecord>(
    `/tasks/${taskGid}?opt_fields=${TASK_OPT_FIELDS}`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify({ data: { custom_fields: { [fieldGid]: value } } }),
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

type AsanaTaskMembershipRecord = {
  memberships?: Array<{
    project?: { gid?: string } | null;
    section?: { gid?: string; name?: string } | null;
  }>;
};

type AsanaCustomFieldSettingRecord = {
  custom_field?: {
    gid?: string;
    name?: string;
    type?: string;
    enum_options?: Array<{ gid?: string; name?: string; enabled?: boolean }>;
  } | null;
};

export async function getProjectCustomFields(
  accessToken: string,
  projectGid: string
): Promise<AsanaCustomField[]> {
  const settings = await callAsanaList<AsanaCustomFieldSettingRecord>(
    `/projects/${projectGid}/custom_field_settings?opt_fields=custom_field.gid,custom_field.name,custom_field.type,custom_field.enum_options.gid,custom_field.enum_options.name,custom_field.enum_options.enabled&limit=100`,
    accessToken
  );

  return settings
    .map((setting) => setting.custom_field)
    .filter(
      (customField): customField is NonNullable<typeof customField> =>
        Boolean(customField?.gid) && Boolean(customField?.name)
    )
    .map((customField) => ({
      gid: customField.gid!,
      name: customField.name!,
      type: customField.type ?? 'text',
      ...(customField.enum_options
        ? {
            enumOptions: customField.enum_options
              .filter((option) => option.enabled !== false && option.gid && option.name)
              .map((option) => ({ gid: option.gid!, name: option.name! })),
          }
        : {}),
    }));
}

export async function getProjectSections(
  accessToken: string,
  projectGid: string
): Promise<AsanaSection[]> {
  // Asana doesn't offer a scopable "list sections" endpoint (it's only available under the
  // full-permissions `default` scope, which this app deliberately avoids requesting). Instead,
  // derive the section list from the project's own tasks, which is covered by `tasks:read`.
  // This only surfaces sections that currently contain at least one task - a brand-new empty
  // board column won't appear until something lands in it.
  const tasks = await callAsanaList<AsanaTaskMembershipRecord>(
    `/projects/${projectGid}/tasks?opt_fields=memberships.project.gid,memberships.section.gid,memberships.section.name&limit=100`,
    accessToken
  );

  const sections = new Map<string, string>();
  for (const task of tasks) {
    for (const membership of task.memberships ?? []) {
      if (membership.project?.gid !== projectGid) {
        continue;
      }
      if (membership.section?.gid && membership.section?.name) {
        sections.set(membership.section.gid, membership.section.name);
      }
    }
  }

  return Array.from(sections, ([gid, name]) => ({ gid, name }));
}

export async function moveTaskToSection(
  accessToken: string,
  taskGid: string,
  sectionGid: string
): Promise<void> {
  await callAsana<Record<string, unknown>>(`/sections/${sectionGid}/addTask`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ data: { task: taskGid } }),
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
