import { VALIDATION_MESSAGES } from '../src/const';
import type { AppInstallationParameters, CreateAsanaTaskResponse } from '../src/types';
import { createTask, findDuplicateTaskByName, TaskRefreshFailedError } from './asanaClient';

type CreateTaskFromParametersInput = {
  accessToken: string;
  title?: string;
  notes?: string;
  projectGid?: string;
  workspaceGid?: string;
  installationParameters?: Partial<AppInstallationParameters>;
  checkDuplicateName?: boolean;
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
  checkDuplicateName,
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

  if (checkDuplicateName) {
    try {
      const duplicate = await findDuplicateTaskByName(
        trimmedToken,
        resolvedProjectGid
          ? { projectGid: resolvedProjectGid }
          : { workspaceGid: resolvedWorkspaceGid },
        trimmedTitle
      );

      if (duplicate) {
        return {
          success: false,
          duplicateTaskName: true,
          duplicateTask: duplicate,
          message: `A task named "${duplicate.name}" already exists in Asana.`,
        };
      }
    } catch {
      // Best-effort duplicate check; if it fails (rate limit, transient error), fall through and
      // create the task normally rather than blocking task creation on it.
    }
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
