import { VALIDATION_MESSAGES } from '../src/const';
import type { AppInstallationParameters, CreateAsanaTaskResponse } from '../src/types';
import { createTask, TaskRefreshFailedError } from './asanaClient';

type CreateTaskFromParametersInput = {
  accessToken: string;
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
  accessToken,
  title,
  notes,
  projectGid,
  workspaceGid,
  installationParameters,
}: CreateTaskFromParametersInput): Promise<CreateAsanaTaskResponse> {
  const trimmedToken = getTrimmedValue(accessToken);
  const trimmedTitle = getTrimmedValue(title);
  const trimmedNotes = getTrimmedValue(notes);
  const resolvedProjectGid =
    getTrimmedValue(projectGid) || getTrimmedValue(installationParameters?.defaultProjectGid);
  const resolvedWorkspaceGid =
    getTrimmedValue(workspaceGid) || getTrimmedValue(installationParameters?.defaultWorkspaceGid);

  if (!trimmedToken) {
    throw new Error(VALIDATION_MESSAGES.tokenRequired);
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
      task,
      ...(resolvedProjectGid ? { projectGid: resolvedProjectGid } : {}),
      ...(resolvedWorkspaceGid ? { workspaceGid: resolvedWorkspaceGid } : {}),
    };
  } catch (error) {
    if (error instanceof TaskRefreshFailedError) {
      // The task was created successfully; only the follow-up full-detail fetch failed.
      return {
        success: true,
        message: error.message,
        task: error.task,
        ...(resolvedProjectGid ? { projectGid: resolvedProjectGid } : {}),
        ...(resolvedWorkspaceGid ? { workspaceGid: resolvedWorkspaceGid } : {}),
      };
    }

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
