import { DialogAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  Paragraph,
  Pill,
  Select,
  SectionHeading,
  Text,
  TextInput,
  TextLink,
  Textarea,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useMemo, useState } from 'react';
import { VALIDATION_MESSAGES } from '../const';
import type {
  AddAsanaCommentResponse,
  AsanaComment,
  AsanaCustomFieldValue,
  AsanaSection,
  AsanaSubtask,
  AsanaTaskOption,
  AsanaUserOption,
  GetAsanaCommentsResponse,
  GetAsanaSectionsResponse,
  GetAsanaSubtasksResponse,
  GetAsanaTasksResponse,
  GetAsanaUsersResponse,
  TaskDetailsDialogParameters,
  TaskDetailsDialogResult,
  UpdateAsanaCustomFieldResponse,
  UpdateAsanaTaskResponse,
} from '../types';

function formatFullDate(isoDate?: string) {
  if (!isoDate) {
    return '';
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCommentTimestamp(isoDate: string) {
  if (!isoDate) {
    return '';
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffMinutes < 1) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const VISIBLE_COMMENT_COUNT = 3;
const COMMENT_AVATAR_COLORS = ['#0d7f8c', '#7e3aad', '#c2185b', '#2c6ecb', '#e07a00', '#3f8c3f'];

function getCommentInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return '?';
  }
  const parts = trimmed.split(/\s+/);
  const initials =
    parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0].slice(0, 2);
  return initials.toUpperCase();
}

function getCommentAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COMMENT_AVATAR_COLORS[Math.abs(hash) % COMMENT_AVATAR_COLORS.length];
}

const LOADING_DOT_KEYFRAMES = `
  @keyframes asanaCommentsLoadingBounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }
`;

const LoadingDots = () => (
  <Flex alignItems="center" gap="spacingXs" style={{ height: '20px' }}>
    <style>{LOADING_DOT_KEYFRAMES}</style>
    {[0, 1, 2].map((index) => (
      <Box
        key={index}
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: tokens.gray400,
          animation: 'asanaCommentsLoadingBounce 1.4s ease-in-out infinite',
          animationDelay: `${index * 0.16}s`,
        }}
      />
    ))}
  </Flex>
);

const CUSTOM_FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Text',
  number: 'Number',
  enum: 'Single-select',
  multi_enum: 'Multi-select',
  date: 'Date',
  people: 'People',
};

const EDITABLE_CUSTOM_FIELD_TYPES = new Set(Object.keys(CUSTOM_FIELD_TYPE_LABELS));

// Shapes a custom field's local draft value into the JSON string the
// `updateAsanaCustomFieldAction` App Action expects for that field's type.
export function buildCustomFieldValuePayload(field: AsanaCustomFieldValue): string {
  switch (field.type) {
    case 'text': {
      // Asana expects `null` to clear a Text custom field; sending an empty string
      // instead triggers a generic server error, so only send a non-empty value.
      const trimmed = field.textValue?.trim();
      return JSON.stringify(trimmed ? trimmed : null);
    }
    case 'number': {
      if (typeof field.numberValue !== 'number' || Number.isNaN(field.numberValue)) {
        return JSON.stringify(null);
      }
      // Asana rejects number values that don't conform to the field's configured precision
      // (e.g. a currency field with 2 decimal places), so round to match it before sending.
      const precision = typeof field.precision === 'number' ? field.precision : null;
      const value =
        precision === null ? field.numberValue : Number(field.numberValue.toFixed(precision));
      return JSON.stringify(value);
    }
    case 'enum':
      return JSON.stringify(field.enumValue?.gid ?? null);
    case 'multi_enum':
      return JSON.stringify((field.multiEnumValues ?? []).map((option) => option.gid));
    case 'date':
      return JSON.stringify(field.dateValue ? { date: field.dateValue } : null);
    case 'people':
      return JSON.stringify((field.peopleValue ?? []).map((person) => person.gid));
    default:
      return JSON.stringify(field.textValue ?? null);
  }
}

type CustomFieldEditorProps = {
  field: AsanaCustomFieldValue;
  workspaceGid: string;
  isDisabled: boolean;
  callAction: <TResult>(
    appActionId: string,
    actionParameters?: Record<string, string | boolean>
  ) => Promise<TResult>;
  onChange: (fieldGid: string, patch: Partial<AsanaCustomFieldValue>) => void;
};

const CustomFieldEditor = ({
  field,
  workspaceGid,
  isDisabled,
  callAction,
  onChange,
}: CustomFieldEditorProps) => {
  const [peopleQuery, setPeopleQuery] = useState('');
  const [peopleResults, setPeopleResults] = useState<AsanaUserOption[]>([]);
  const [isSearchingPeople, setIsSearchingPeople] = useState(false);

  useEffect(() => {
    if (field.type !== 'people' || !workspaceGid || !peopleQuery.trim()) {
      setPeopleResults([]);
      setIsSearchingPeople(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSearchingPeople(true);
      try {
        const response = await callAction<GetAsanaUsersResponse>('getAsanaUsersAction', {
          workspaceGid,
          query: peopleQuery.trim(),
        });
        setPeopleResults(
          response.users.filter(
            (candidate) => !(field.peopleValue ?? []).some((person) => person.gid === candidate.gid)
          )
        );
      } catch {
        setPeopleResults([]);
      } finally {
        setIsSearchingPeople(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [callAction, field.peopleValue, field.type, peopleQuery, workspaceGid]);

  if (field.type === 'text') {
    return (
      <TextInput
        value={field.textValue ?? ''}
        onChange={(event) => onChange(field.gid, { textValue: event.target.value })}
        isDisabled={isDisabled}
      />
    );
  }

  if (field.type === 'number') {
    return (
      <TextInput
        type="number"
        step={typeof field.precision === 'number' ? Math.pow(10, -field.precision) : 'any'}
        value={typeof field.numberValue === 'number' ? String(field.numberValue) : ''}
        onChange={(event) =>
          onChange(field.gid, {
            numberValue: event.target.value === '' ? undefined : Number(event.target.value),
          })
        }
        isDisabled={isDisabled}
      />
    );
  }

  if (field.type === 'enum') {
    return (
      <Select
        value={field.enumValue?.gid ?? ''}
        onChange={(event) => {
          const selected = field.enumOptions?.find((option) => option.gid === event.target.value);
          onChange(field.gid, { enumValue: selected ?? null });
        }}
        isDisabled={isDisabled}>
        <Select.Option value="">None</Select.Option>
        {(field.enumOptions ?? []).map((option) => (
          <Select.Option key={option.gid} value={option.gid}>
            {option.name}
          </Select.Option>
        ))}
      </Select>
    );
  }

  if (field.type === 'multi_enum') {
    const selectedGids = new Set((field.multiEnumValues ?? []).map((option) => option.gid));
    const availableOptions = (field.enumOptions ?? []).filter(
      (option) => !selectedGids.has(option.gid)
    );

    return (
      <Box>
        <Flex gap="spacingXs" flexWrap="wrap" marginBottom="spacingXs">
          {(field.multiEnumValues ?? []).length ? (
            (field.multiEnumValues ?? []).map((option) => (
              <Pill
                key={option.gid}
                label={option.name}
                onClose={() =>
                  onChange(field.gid, {
                    multiEnumValues: (field.multiEnumValues ?? []).filter(
                      (selected) => selected.gid !== option.gid
                    ),
                  })
                }
                closeButtonAriaLabel={`Remove ${option.name}`}
              />
            ))
          ) : (
            <Text fontColor="gray500">None selected.</Text>
          )}
        </Flex>
        {availableOptions.length ? (
          <Select
            value=""
            onChange={(event) => {
              const selected = field.enumOptions?.find(
                (option) => option.gid === event.target.value
              );
              if (selected) {
                onChange(field.gid, {
                  multiEnumValues: [...(field.multiEnumValues ?? []), selected],
                });
              }
            }}
            isDisabled={isDisabled}>
            <Select.Option value="">Add option</Select.Option>
            {availableOptions.map((option) => (
              <Select.Option key={option.gid} value={option.gid}>
                {option.name}
              </Select.Option>
            ))}
          </Select>
        ) : null}
      </Box>
    );
  }

  if (field.type === 'date') {
    return (
      <TextInput
        type="date"
        value={field.dateValue ?? ''}
        onChange={(event) => onChange(field.gid, { dateValue: event.target.value })}
        isDisabled={isDisabled}
      />
    );
  }

  if (field.type === 'people') {
    return (
      <Box>
        <Flex gap="spacingXs" flexWrap="wrap" marginBottom="spacingXs">
          {(field.peopleValue ?? []).length ? (
            (field.peopleValue ?? []).map((person) => (
              <Pill
                key={person.gid}
                label={person.name}
                onClose={() =>
                  onChange(field.gid, {
                    peopleValue: (field.peopleValue ?? []).filter(
                      (selected) => selected.gid !== person.gid
                    ),
                  })
                }
                closeButtonAriaLabel={`Remove ${person.name}`}
              />
            ))
          ) : (
            <Text fontColor="gray500">None selected.</Text>
          )}
        </Flex>
        <Box style={{ position: 'relative' }}>
          <TextInput
            value={peopleQuery}
            onChange={(event) => setPeopleQuery(event.target.value)}
            placeholder="Search Asana people to add"
            isDisabled={isDisabled}
          />
          {peopleQuery.trim() ? (
            <Box
              marginTop="spacing2Xs"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 2,
                border: '1px solid #cfd9e0',
                borderRadius: '6px',
                backgroundColor: 'white',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
              }}>
              {isSearchingPeople ? (
                <Paragraph margin="spacingS">Searching Asana people...</Paragraph>
              ) : peopleResults.length ? (
                <Flex flexDirection="column" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  {peopleResults.map((candidate, index) => (
                    <Button
                      key={candidate.gid}
                      variant="transparent"
                      isFullWidth
                      isDisabled={isDisabled}
                      onClick={() => {
                        onChange(field.gid, {
                          peopleValue: [...(field.peopleValue ?? []), candidate],
                        });
                        setPeopleQuery('');
                        setPeopleResults([]);
                      }}
                      style={{
                        justifyContent: 'flex-start',
                        borderRadius: 0,
                        borderTop: index === 0 ? 'none' : '1px solid #e5ebed',
                      }}>
                      {candidate.name}
                      {candidate.email ? ` (${candidate.email})` : ''}
                    </Button>
                  ))}
                </Flex>
              ) : (
                <Paragraph margin="spacingS">No matching people found.</Paragraph>
              )}
            </Box>
          ) : null}
        </Box>
      </Box>
    );
  }

  return <Text fontColor="gray500">{field.displayValue || 'Not editable in this app.'}</Text>;
};

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  useAutoResizer();

  const invocation = (sdk.parameters.invocation ?? {}) as unknown as TaskDetailsDialogParameters;
  const task = invocation.taskGid
    ? {
        taskGid: invocation.taskGid,
        taskName: invocation.taskName,
        taskUrl: invocation.taskUrl,
        taskDescription: invocation.taskDescription,
        status: invocation.status,
        assigneeName: invocation.assigneeName,
        dueDate: invocation.dueDate,
        createdAt: invocation.createdAt,
        modifiedAt: invocation.modifiedAt,
        tags: invocation.tags,
      }
    : null;
  const workspaceGid = invocation.workspaceGid ?? '';
  const projectGid = invocation.projectGid ?? '';

  const [description, setDescription] = useState(invocation.taskDescription ?? '');
  const [dueDate, setDueDate] = useState(invocation.dueDate ?? '');
  const [sections, setSections] = useState<AsanaSection[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [selectedSectionGid, setSelectedSectionGid] = useState(invocation.sectionGid ?? '');
  const [assigneeQuery, setAssigneeQuery] = useState('');
  const [assigneeResults, setAssigneeResults] = useState<AsanaUserOption[]>([]);
  const [isSearchingAssignees, setIsSearchingAssignees] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<AsanaUserOption | null>(null);
  const [assigneeCleared, setAssigneeCleared] = useState(false);
  const [pendingDependencyAdds, setPendingDependencyAdds] = useState<AsanaTaskOption[]>([]);
  const [pendingDependencyRemovals, setPendingDependencyRemovals] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<AsanaCustomFieldValue[]>(
    invocation.customFields ?? []
  );
  const [dirtyCustomFieldGids, setDirtyCustomFieldGids] = useState<Set<string>>(new Set());
  const [dependencyQuery, setDependencyQuery] = useState('');
  const [dependencyResults, setDependencyResults] = useState<AsanaTaskOption[]>([]);
  const [isSearchingDependencies, setIsSearchingDependencies] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<AsanaComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [subtasks, setSubtasks] = useState<AsanaSubtask[]>([]);
  const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);
  const [subtasksError, setSubtasksError] = useState<string | null>(null);
  const [pendingSubtaskGids, setPendingSubtaskGids] = useState<Set<string>>(new Set());
  const [commentSortOrder, setCommentSortOrder] = useState<'oldest' | 'newest'>('oldest');
  const [areAllCommentsShown, setAreAllCommentsShown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);

  const effectiveDependencies = [
    ...(invocation.dependencies ?? []).filter(
      (dependency) => !pendingDependencyRemovals.includes(dependency.gid)
    ),
    ...pendingDependencyAdds,
  ];

  const hasDescriptionChanges = useMemo(
    () => description.trim() !== (task?.taskDescription ?? '').trim(),
    [description, task?.taskDescription]
  );

  const chronologicalComments = useMemo(
    () =>
      [...comments].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [comments]
  );
  const hiddenCommentCount = Math.max(chronologicalComments.length - VISIBLE_COMMENT_COUNT, 0);
  const displayedComments = areAllCommentsShown
    ? chronologicalComments
    : chronologicalComments.slice(-VISIBLE_COMMENT_COUNT);
  const orderedComments =
    commentSortOrder === 'newest' ? [...displayedComments].reverse() : displayedComments;
  const moreCommentsLink = !hiddenCommentCount ? null : areAllCommentsShown ? (
    <TextLink as="button" variant="secondary" onClick={() => setAreAllCommentsShown(false)}>
      Hide earlier comments
    </TextLink>
  ) : (
    <TextLink as="button" variant="secondary" onClick={() => setAreAllCommentsShown(true)}>
      {hiddenCommentCount} more comment{hiddenCommentCount === 1 ? '' : 's'}
    </TextLink>
  );
  const hasDueDateChanges = dueDate !== (invocation.dueDate ?? '');
  const hasAssigneeChanges = Boolean(selectedAssignee) || assigneeCleared;
  const hasDependencyChanges =
    pendingDependencyAdds.length > 0 || pendingDependencyRemovals.length > 0;
  const hasSectionChanges = Boolean(
    selectedSectionGid && selectedSectionGid !== (invocation.sectionGid ?? '')
  );
  const hasCustomFieldChanges = dirtyCustomFieldGids.size > 0;
  const hasDetailChanges =
    hasDescriptionChanges ||
    hasDueDateChanges ||
    hasAssigneeChanges ||
    hasDependencyChanges ||
    hasSectionChanges ||
    hasCustomFieldChanges;
  const isBusy = isSaving || isPostingComment;

  const handleCustomFieldChange = (fieldGid: string, patch: Partial<AsanaCustomFieldValue>) => {
    setCustomFields((current) =>
      current.map((field) => (field.gid === fieldGid ? { ...field, ...patch } : field))
    );
    setDirtyCustomFieldGids((current) => {
      const next = new Set(current);
      next.add(fieldGid);
      return next;
    });
  };

  const callAction = async <TResult,>(
    appActionId: string,
    actionParameters: Record<string, string | boolean> = {}
  ): Promise<TResult> => {
    // Uses createWithResult (not createWithResponse) because createWithResponse's
    // polling hits a legacy endpoint that has a call-not-found race right after
    // creation, which the currently bundled web app CMA client doesn't retry.
    let call;
    try {
      call = await sdk.cma.appActionCall.createWithResult(
        { appDefinitionId: sdk.ids.app!, appActionId },
        { parameters: actionParameters }
      );
    } catch (error) {
      const detail =
        error instanceof Error && error.message
          ? error.message
          : (() => {
              try {
                return JSON.stringify(error);
              } catch {
                return String(error);
              }
            })();
      throw new Error(`App action call request failed (${detail})`);
    }

    if (call.sys.status === 'failed') {
      throw new Error(
        call.sys.error.message || `App action call failed (${JSON.stringify(call.sys.error)})`
      );
    }

    if (call.sys.status !== 'succeeded') {
      throw new Error(`Unexpected app action call status: ${call.sys.status}`);
    }

    return call.sys.result as TResult;
  };

  useEffect(() => {
    if (!workspaceGid || !assigneeQuery.trim()) {
      setAssigneeResults([]);
      setIsSearchingAssignees(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSearchingAssignees(true);
      try {
        const response = await callAction<GetAsanaUsersResponse>('getAsanaUsersAction', {
          workspaceGid,
          query: assigneeQuery.trim(),
        });
        setAssigneeResults(response.users);
      } catch {
        setAssigneeResults([]);
      } finally {
        setIsSearchingAssignees(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [assigneeQuery, workspaceGid]);

  useEffect(() => {
    if (!workspaceGid || !dependencyQuery.trim()) {
      setDependencyResults([]);
      setIsSearchingDependencies(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSearchingDependencies(true);
      try {
        const response = await callAction<GetAsanaTasksResponse>('getAsanaTasksAction', {
          workspaceGid,
          query: dependencyQuery.trim(),
        });
        setDependencyResults(
          response.tasks.filter(
            (candidate) =>
              candidate.gid !== task?.taskGid &&
              !effectiveDependencies.some((dependency) => dependency.gid === candidate.gid)
          )
        );
      } catch {
        setDependencyResults([]);
      } finally {
        setIsSearchingDependencies(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dependencyQuery, workspaceGid]);

  useEffect(() => {
    if (!projectGid) {
      setSections([]);
      return;
    }

    let isCancelled = false;
    setIsLoadingSections(true);

    (async () => {
      try {
        const response = await callAction<GetAsanaSectionsResponse>('getAsanaSectionsAction', {
          projectGid,
        });
        if (!isCancelled) {
          if (!response.success) {
            sdk.notifier.error(response.message || VALIDATION_MESSAGES.sectionsFailed);
          }
          setSections(response.sections ?? []);
        }
      } catch (error) {
        if (!isCancelled) {
          const message =
            error instanceof Error && error.message
              ? error.message
              : `${VALIDATION_MESSAGES.sectionsFailed} (${String(error)})`;
          sdk.notifier.error(message);
          setSections([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSections(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [projectGid]);

  const loadComments = async () => {
    if (!task) {
      return;
    }

    setIsLoadingComments(true);
    setCommentsError(null);
    try {
      const response = await callAction<GetAsanaCommentsResponse>('getAsanaCommentsAction', {
        taskId: task.taskGid,
      });

      if (!response.success) {
        setComments([]);
        setCommentsError(response.message || VALIDATION_MESSAGES.commentsFailed);
        return;
      }

      setComments(response.comments ?? []);
    } catch (error) {
      setComments([]);
      setCommentsError(
        error instanceof Error && error.message ? error.message : VALIDATION_MESSAGES.commentsFailed
      );
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    void loadComments();
  }, [task?.taskGid]);

  const loadSubtasks = async () => {
    if (!task) {
      return;
    }

    setIsLoadingSubtasks(true);
    setSubtasksError(null);
    try {
      const response = await callAction<GetAsanaSubtasksResponse>('getAsanaSubtasksAction', {
        taskId: task.taskGid,
      });

      if (!response.success) {
        setSubtasks([]);
        setSubtasksError(response.message || VALIDATION_MESSAGES.subtasksFailed);
        return;
      }

      setSubtasks(response.subtasks ?? []);
    } catch (error) {
      setSubtasks([]);
      setSubtasksError(
        error instanceof Error && error.message ? error.message : VALIDATION_MESSAGES.subtasksFailed
      );
    } finally {
      setIsLoadingSubtasks(false);
    }
  };

  useEffect(() => {
    void loadSubtasks();
  }, [task?.taskGid]);

  const handleToggleSubtask = async (subtaskGid: string, completed: boolean) => {
    setPendingSubtaskGids((current) => {
      const next = new Set(current);
      next.add(subtaskGid);
      return next;
    });
    setSubtasks((current) =>
      current.map((subtask) => (subtask.gid === subtaskGid ? { ...subtask, completed } : subtask))
    );

    try {
      const response = await callAction<UpdateAsanaTaskResponse>('updateAsanaTaskAction', {
        taskId: subtaskGid,
        completed,
      });

      if (!response.success) {
        throw new Error(response.message || VALIDATION_MESSAGES.taskUpdateFailed);
      }
    } catch (error) {
      setSubtasks((current) =>
        current.map((subtask) =>
          subtask.gid === subtaskGid ? { ...subtask, completed: !completed } : subtask
        )
      );
      sdk.notifier.error(
        error instanceof Error && error.message
          ? error.message
          : VALIDATION_MESSAGES.taskUpdateFailed
      );
    } finally {
      setPendingSubtaskGids((current) => {
        const next = new Set(current);
        next.delete(subtaskGid);
        return next;
      });
    }
  };

  const handleSaveDetails = async () => {
    if (!task || !hasDetailChanges) {
      return;
    }

    setIsSaving(true);

    try {
      const fieldUpdateParams = {
        ...(hasDescriptionChanges ? { notes: description.trim() } : {}),
        ...(hasAssigneeChanges ? { assignee: selectedAssignee ? selectedAssignee.gid : '' } : {}),
        ...(hasDueDateChanges ? { dueDate: dueDate.trim() } : {}),
        ...(hasSectionChanges ? { sectionGid: selectedSectionGid } : {}),
      };
      const hasTaskFieldChanges = Object.keys(fieldUpdateParams).length > 0;

      // dependencyGid encodes add vs. remove in a single param (prefix "-" to remove) since
      // App Actions cap parameter count at 8. One op per add/remove, sent as separate calls.
      const dependencyOps: Array<Record<string, string>> = [
        ...pendingDependencyAdds.map((dependency) => ({ dependencyGid: dependency.gid })),
        ...pendingDependencyRemovals.map((gid) => ({ dependencyGid: `-${gid}` })),
      ];

      let latestTask: UpdateAsanaTaskResponse['task'] | undefined;

      if (hasTaskFieldChanges || dependencyOps.length > 0) {
        if (dependencyOps.length === 0) {
          const response = await callAction<UpdateAsanaTaskResponse>('updateAsanaTaskAction', {
            taskId: task.taskGid,
            ...fieldUpdateParams,
          });

          if (!response.success || !response.task) {
            throw new Error(response.message || VALIDATION_MESSAGES.taskUpdateFailed);
          }

          latestTask = response.task;
        } else {
          for (let index = 0; index < dependencyOps.length; index += 1) {
            const response = await callAction<UpdateAsanaTaskResponse>('updateAsanaTaskAction', {
              taskId: task.taskGid,
              ...(index === 0 ? fieldUpdateParams : {}),
              ...dependencyOps[index],
            });

            if (!response.success || !response.task) {
              throw new Error(response.message || VALIDATION_MESSAGES.taskUpdateFailed);
            }

            latestTask = response.task;
          }
        }
      }

      // Each custom field is its own App Action call since updateAsanaCustomFieldAction takes a
      // single field gid + value pair, rather than batching all edited fields into one call.
      for (const field of customFields) {
        if (!dirtyCustomFieldGids.has(field.gid)) {
          continue;
        }

        const response = await callAction<UpdateAsanaCustomFieldResponse>(
          'updateAsanaCustomFieldAction',
          {
            taskId: task.taskGid,
            fieldGid: field.gid,
            fieldType: field.type,
            value: buildCustomFieldValuePayload(field),
          }
        );

        if (!response.success || !response.task) {
          throw new Error(response.message || VALIDATION_MESSAGES.customFieldUpdateFailed);
        }

        latestTask = response.task;
      }

      if (!latestTask) {
        throw new Error(VALIDATION_MESSAGES.taskUpdateFailed);
      }

      sdk.notifier.success(VALIDATION_MESSAGES.taskUpdated);
      sdk.close({ updatedTask: latestTask } satisfies TaskDetailsDialogResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : VALIDATION_MESSAGES.taskUpdateFailed;
      sdk.notifier.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAssignee = (user: AsanaUserOption) => {
    setSelectedAssignee(user);
    setAssigneeCleared(false);
    setAssigneeQuery('');
    setAssigneeResults([]);
  };

  const handleClearAssigneeSelection = () => {
    setSelectedAssignee(null);
    setAssigneeCleared(false);
  };

  const handleUnassign = () => {
    setSelectedAssignee(null);
    setAssigneeCleared(true);
    setAssigneeQuery('');
    setAssigneeResults([]);
  };

  const handleAddDependency = (candidate: AsanaTaskOption) => {
    setPendingDependencyAdds((current) =>
      current.some((dependency) => dependency.gid === candidate.gid)
        ? current
        : [...current, candidate]
    );
    setDependencyQuery('');
    setDependencyResults([]);
  };

  const handleRemoveDependency = (dependencyGid: string) => {
    if (pendingDependencyAdds.some((dependency) => dependency.gid === dependencyGid)) {
      setPendingDependencyAdds((current) =>
        current.filter((dependency) => dependency.gid !== dependencyGid)
      );
      return;
    }

    setPendingDependencyRemovals((current) =>
      current.includes(dependencyGid) ? current : [...current, dependencyGid]
    );
  };

  const handleAddComment = async () => {
    if (!task) {
      return;
    }

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      sdk.notifier.error(VALIDATION_MESSAGES.taskCommentRequired);
      return;
    }

    setIsPostingComment(true);

    try {
      const response = await callAction<AddAsanaCommentResponse>('addAsanaCommentAction', {
        taskId: task.taskGid,
        comment: trimmedComment,
      });

      if (!response.success) {
        throw new Error(response.message || VALIDATION_MESSAGES.taskCommentFailed);
      }

      setComment('');
      await loadComments();
      sdk.notifier.success(VALIDATION_MESSAGES.taskCommentAdded);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : VALIDATION_MESSAGES.taskCommentFailed;
      sdk.notifier.error(message);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleClose = () => {
    sdk.close();
  };

  if (!task) {
    return (
      <Box padding="spacingL">
        <Paragraph marginBottom="spacingM">
          No linked Asana task was provided to this dialog.
        </Paragraph>
        <Button onClick={handleClose}>Close</Button>
      </Box>
    );
  }

  return (
    <Box
      padding="spacingL"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '640px',
      }}>
      <Flex
        flexDirection="column"
        gap="spacingL"
        alignItems="stretch"
        style={{ width: '100%', overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
        <Box>
          <Text as="div" marginBottom="spacing2Xs" fontColor="gray600">
            Linked task
          </Text>
          <SectionHeading marginBottom="spacing2Xs">{task.taskName}</SectionHeading>
          <TextLink href={task.taskUrl} target="_blank" rel="noreferrer">
            Open in Asana
          </TextLink>
        </Box>

        <Box>
          <Text as="div" marginBottom="spacing2Xs" fontColor="gray600">
            Status
          </Text>
          <Text>{task.status || 'Unknown'}</Text>
        </Box>

        <Flex gap="spacingL" flexWrap="wrap">
          <Box>
            <Text as="div" marginBottom="spacing2Xs" fontColor="gray600">
              Created on
            </Text>
            <Text>{formatFullDate(task.createdAt) || 'Unknown'}</Text>
          </Box>
          <Box>
            <Text as="div" marginBottom="spacing2Xs" fontColor="gray600">
              Last modified
            </Text>
            <Text>{formatFullDate(task.modifiedAt) || 'Unknown'}</Text>
          </Box>
        </Flex>

        <Flex gap="spacingL" flexWrap="wrap">
          <FormControl style={{ minWidth: '260px', flex: 1 }}>
            <Flex justifyContent="space-between" alignItems="center">
              <FormControl.Label marginBottom="none">Assignee</FormControl.Label>
              {selectedAssignee || (task.assigneeName && !assigneeCleared) ? (
                <Button
                  variant="transparent"
                  size="small"
                  onClick={selectedAssignee ? handleClearAssigneeSelection : handleUnassign}
                  isDisabled={isBusy}>
                  {selectedAssignee ? 'Cancel' : 'Unassign'}
                </Button>
              ) : null}
            </Flex>
            {selectedAssignee || assigneeCleared ? (
              <Box marginBottom="spacingXs">
                <Pill
                  label={assigneeCleared ? 'Unassigned' : selectedAssignee!.name}
                  onClose={handleClearAssigneeSelection}
                  closeButtonAriaLabel="Clear assignee selection"
                />
              </Box>
            ) : null}
            <Box style={{ position: 'relative' }}>
              <TextInput
                value={assigneeQuery}
                onChange={(event) => setAssigneeQuery(event.target.value)}
                placeholder={
                  selectedAssignee
                    ? selectedAssignee.name
                    : task.assigneeName || 'Search people to assign'
                }
                isDisabled={isBusy}
              />
              {assigneeQuery.trim() ? (
                <Box
                  marginTop="spacing2Xs"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 2,
                    border: '1px solid #cfd9e0',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden',
                  }}>
                  {isSearchingAssignees ? (
                    <Paragraph margin="spacingS">Searching Asana people...</Paragraph>
                  ) : assigneeResults.length ? (
                    <Flex flexDirection="column" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                      {assigneeResults.map((candidate, index) => (
                        <Button
                          key={candidate.gid}
                          variant="transparent"
                          isFullWidth
                          isDisabled={isBusy}
                          onClick={() => handleSelectAssignee(candidate)}
                          style={{
                            justifyContent: 'flex-start',
                            borderRadius: 0,
                            borderTop: index === 0 ? 'none' : '1px solid #e5ebed',
                          }}>
                          {candidate.name}
                          {candidate.email ? ` (${candidate.email})` : ''}
                        </Button>
                      ))}
                    </Flex>
                  ) : (
                    <Paragraph margin="spacingS">No matching people found.</Paragraph>
                  )}
                </Box>
              ) : null}
            </Box>
            <FormControl.HelpText style={{ minHeight: '2.5em' }}>
              Currently: {task.assigneeName || 'Unassigned'}. Search by name or email to reassign.
            </FormControl.HelpText>
          </FormControl>
          <FormControl style={{ minWidth: '200px', flex: 1 }}>
            <FormControl.Label>Due date</FormControl.Label>
            <TextInput
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              isDisabled={isBusy}
            />
            <FormControl.HelpText style={{ minHeight: '2.5em' }}>
              Clear the date to remove the due date.
            </FormControl.HelpText>
          </FormControl>
        </Flex>

        <Box>
          <Text as="div" marginBottom="spacingXs" fontColor="gray600">
            Dependencies
          </Text>
          <Flex gap="spacingXs" flexWrap="wrap" marginBottom="spacingS">
            {effectiveDependencies.length ? (
              effectiveDependencies.map((dependency) => (
                <Pill
                  key={dependency.gid}
                  label={dependency.name}
                  onClose={() => handleRemoveDependency(dependency.gid)}
                  closeButtonAriaLabel={`Remove ${dependency.name} dependency`}
                />
              ))
            ) : (
              <Text fontColor="gray500">No dependencies.</Text>
            )}
          </Flex>
          {workspaceGid ? (
            <FormControl marginBottom="none">
              <FormControl.Label>Add dependency</FormControl.Label>
              <Box style={{ position: 'relative' }}>
                <TextInput
                  value={dependencyQuery}
                  onChange={(event) => setDependencyQuery(event.target.value)}
                  placeholder="Search Asana tasks to add as a dependency"
                  isDisabled={isBusy}
                />
                {dependencyQuery.trim() ? (
                  <Box
                    marginTop="spacing2Xs"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 2,
                      border: '1px solid #cfd9e0',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                      overflow: 'hidden',
                    }}>
                    {isSearchingDependencies ? (
                      <Paragraph margin="spacingS">Searching Asana tasks...</Paragraph>
                    ) : dependencyResults.length ? (
                      <Flex
                        flexDirection="column"
                        style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        {dependencyResults.map((candidate, index) => (
                          <Button
                            key={candidate.gid}
                            variant="transparent"
                            isFullWidth
                            isDisabled={isBusy}
                            onClick={() => handleAddDependency(candidate)}
                            style={{
                              justifyContent: 'flex-start',
                              borderRadius: 0,
                              borderTop: index === 0 ? 'none' : '1px solid #e5ebed',
                            }}>
                            {candidate.name}
                          </Button>
                        ))}
                      </Flex>
                    ) : (
                      <Paragraph margin="spacingS">No matching tasks found.</Paragraph>
                    )}
                  </Box>
                ) : null}
              </Box>
            </FormControl>
          ) : null}
        </Box>

        <Box>
          <Text as="div" marginBottom="spacingXs" fontColor="gray600">
            Subtasks
          </Text>
          {isLoadingSubtasks ? (
            <Box marginBottom="spacingS">
              <LoadingDots />
            </Box>
          ) : subtasksError ? (
            <Text fontColor="red600" as="div">
              {subtasksError}
            </Text>
          ) : subtasks.length ? (
            <Flex flexDirection="column" gap="spacingS">
              {subtasks.map((subtask) => (
                <Flex key={subtask.gid} gap="spacingXs" alignItems="flex-start">
                  <Box style={{ paddingTop: '2px' }}>
                    <Checkbox
                      isChecked={subtask.completed}
                      isDisabled={isBusy || pendingSubtaskGids.has(subtask.gid)}
                      onChange={(event) => handleToggleSubtask(subtask.gid, event.target.checked)}
                      aria-label={`Mark ${subtask.name} as ${
                        subtask.completed ? 'incomplete' : 'complete'
                      }`}
                    />
                  </Box>
                  <Box style={{ flexGrow: 1 }}>
                    <TextLink
                      href={subtask.permalinkUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={subtask.completed ? { textDecoration: 'line-through' } : undefined}>
                      {subtask.name}
                    </TextLink>
                    {subtask.assigneeName || subtask.dueDate ? (
                      <Text as="div" fontColor="gray500" fontSize="fontSizeS">
                        {[
                          subtask.assigneeName,
                          subtask.dueDate ? `Due ${formatFullDate(subtask.dueDate)}` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    ) : null}
                  </Box>
                </Flex>
              ))}
            </Flex>
          ) : (
            <Text fontColor="gray500">No subtasks.</Text>
          )}
        </Box>

        <Box>
          <Text as="div" marginBottom="spacingXs" fontColor="gray600">
            Tags
          </Text>
          <Flex gap="spacingXs" flexWrap="wrap">
            {task.tags && task.tags.length ? (
              task.tags.map((tag) => <Pill key={tag.gid} label={tag.name} />)
            ) : (
              <Text fontColor="gray500">No tags.</Text>
            )}
          </Flex>
        </Box>

        {projectGid ? (
          <FormControl>
            <FormControl.Label>Section</FormControl.Label>
            <Select
              value={selectedSectionGid}
              onChange={(event) => setSelectedSectionGid(event.target.value)}
              isDisabled={isBusy || isLoadingSections}>
              <Select.Option value="" isDisabled>
                {isLoadingSections ? 'Loading sections…' : 'Select a section'}
              </Select.Option>
              {sections.map((section) => (
                <Select.Option key={section.gid} value={section.gid}>
                  {section.name}
                </Select.Option>
              ))}
            </Select>
            <FormControl.HelpText>
              Currently: {invocation.sectionName || 'None'}. Moves the task between board sections.
            </FormControl.HelpText>
          </FormControl>
        ) : null}

        {customFields.length ? (
          <Box>
            <Text as="div" marginBottom="spacingXs" fontColor="gray600">
              Custom fields
            </Text>
            <Flex flexDirection="column" gap="spacingM">
              {customFields.map((field) => (
                <FormControl key={field.gid} marginBottom="none">
                  <FormControl.Label>{field.name}</FormControl.Label>
                  <CustomFieldEditor
                    field={field}
                    workspaceGid={workspaceGid}
                    isDisabled={isBusy}
                    callAction={callAction}
                    onChange={handleCustomFieldChange}
                  />
                  {!EDITABLE_CUSTOM_FIELD_TYPES.has(field.type) ? (
                    <FormControl.HelpText>
                      {CUSTOM_FIELD_TYPE_LABELS[field.type] || field.type} fields aren&apos;t
                      editable in this app yet.
                    </FormControl.HelpText>
                  ) : null}
                </FormControl>
              ))}
            </Flex>
          </Box>
        ) : null}

        <FormControl>
          <FormControl.Label>Description</FormControl.Label>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={8}
            isDisabled={isBusy}
          />
          <FormControl.HelpText>Updates the linked Asana task description.</FormControl.HelpText>
        </FormControl>

        <Box>
          <FormControl marginBottom="spacingXs">
            <FormControl.Label>Add comment</FormControl.Label>
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              isDisabled={isBusy}
              placeholder="Write a new Asana comment"
            />
            <FormControl.HelpText>
              Posts a new comment to the linked Asana task.
            </FormControl.HelpText>
          </FormControl>

          <Flex justifyContent="flex-end" marginBottom="spacingM">
            <Button
              variant="secondary"
              onClick={handleAddComment}
              isLoading={isPostingComment}
              isDisabled={isBusy}>
              Add comment
            </Button>
          </Flex>

          <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingXs">
            <Text fontColor="gray600" fontWeight="fontWeightMedium">
              Comments
            </Text>
            {comments.length > 1 ? (
              <TextLink
                as="button"
                variant="secondary"
                onClick={() =>
                  setCommentSortOrder((current) => (current === 'oldest' ? 'newest' : 'oldest'))
                }>
                {commentSortOrder === 'oldest' ? '↑ Oldest' : '↓ Newest'}
              </TextLink>
            ) : null}
          </Flex>
          {isLoadingComments ? (
            <Box marginBottom="spacingS">
              <LoadingDots />
            </Box>
          ) : commentsError ? (
            <Text fontColor="red600" as="div" marginBottom="spacingS">
              {commentsError}
            </Text>
          ) : comments.length ? (
            <Flex flexDirection="column" gap="spacingS" marginBottom="spacingS">
              {commentSortOrder === 'oldest' ? moreCommentsLink : null}
              {orderedComments.map((commentItem) => (
                <Flex key={commentItem.gid} gap="spacingS" alignItems="flex-start">
                  <Box
                    style={{
                      flexShrink: 0,
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: getCommentAvatarColor(commentItem.authorName),
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}>
                    {getCommentInitials(commentItem.authorName)}
                  </Box>
                  <Box style={{ flexGrow: 1 }}>
                    <Flex alignItems="baseline" gap="spacingXs">
                      <Text fontWeight="fontWeightMedium">{commentItem.authorName}</Text>
                      <Text fontColor="gray500" fontSize="fontSizeS">
                        {formatCommentTimestamp(commentItem.createdAt)}
                      </Text>
                    </Flex>
                    <Text as="div">{commentItem.text}</Text>
                  </Box>
                </Flex>
              ))}
              {commentSortOrder === 'newest' ? moreCommentsLink : null}
            </Flex>
          ) : (
            <Text fontColor="gray500" as="div" marginBottom="spacingS">
              No comments yet.
            </Text>
          )}
        </Box>
      </Flex>

      <Flex
        justifyContent="flex-end"
        gap="spacingS"
        style={{ flexShrink: 0, paddingTop: tokens.spacingM }}>
        <Button variant="secondary" onClick={handleClose} isDisabled={isBusy}>
          Close
        </Button>
        <Button
          onClick={handleSaveDetails}
          isLoading={isSaving}
          isDisabled={!hasDetailChanges || isBusy}>
          Save changes
        </Button>
      </Flex>
    </Box>
  );
};

export default Dialog;
