import { VALIDATION_MESSAGES } from '../src/const';
import type { AppInstallationParameters, CreateAsanaTaskResponse } from '../src/types';
import { createTask } from './asanaClient';

type CreateTaskFromParametersInput = {
  personalAccessToken: string;
  title?: string;
  notes?: string;
  projectGid?: string;
  workspaceGid?: string;
  installationParameters?: Partial<AppInstallationParameters>;
};

function getTrimmedValue(value?: string) {
  return value?.trim() ?? '';
}

export async function createTaskFromParameters({
  personalAccessToken,
  title,
  notes,
  projectGid,
  workspaceGid,
  installationParameters,
}: CreateTaskFromParametersInput): Promise<CreateAsanaTaskResponse> {
  const trimmedToken = getTrimmedValue(personalAccessToken);
  const trimmedTitle = getTrimmedValue(title);
  const trimmedNotes = getTrimmedValue(notes);
  const resolvedProjectGid =
    getTrimmedValue(projectGid) || getTrimmedValue(installationParameters?.defaultProjectGid);
  const resolvedWorkspaceGid =
    getTrimmedValue(workspaceGid) || getTrimmedValue(installationParameters?.defaultWorkspaceGid);

  if (!trimmedToken) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.tokenRequired,
    };
  }

  if (!trimmedTitle) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.taskTitleRequired,
    };
  }

  if (!resolvedProjectGid && !resolvedWorkspaceGid) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.taskDestinationRequired,
    };
  }

  try {
    const task = await createTask(trimmedToken, {
      name: trimmedTitle,
      ...(trimmedNotes ? { notes: trimmedNotes } : {}),
      ...(resolvedProjectGid ? { projects: [resolvedProjectGid] } : {}),
      ...(resolvedWorkspaceGid ? { workspace: resolvedWorkspaceGid } : {}),
    });

    return {
      success: true,
      message: VALIDATION_MESSAGES.taskCreated,
      task: {
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
      },
      ...(resolvedProjectGid ? { projectGid: resolvedProjectGid } : {}),
      ...(resolvedWorkspaceGid ? { workspaceGid: resolvedWorkspaceGid } : {}),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error && error.message
          ? error.message
          : VALIDATION_MESSAGES.taskCreateFailed,
      ...(resolvedProjectGid ? { projectGid: resolvedProjectGid } : {}),
      ...(resolvedWorkspaceGid ? { workspaceGid: resolvedWorkspaceGid } : {}),
    };
  }
}
