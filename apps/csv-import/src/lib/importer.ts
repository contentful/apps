import PQueue from 'p-queue';
import { PlainClientAPI } from 'contentful-management';
import {
  ParsedRow,
  ColumnMapping,
  ContentTypeMeta,
  ImportMode,
  NaturalKeyConfig,
  ExecutionOutcome,
} from './types';
import { resolveFieldValues, buildFieldsPayload } from './mapping';
import { deepMerge, sleep } from './utils';

interface ImportTask {
  rowIndex: number;
  entryId?: string; // For updates
  fields: Record<string, Record<string, any>>;
}

interface ImportResult {
  rowIndex: number;
  success: boolean;
  entryId?: string;
  error?: string;
}

/**
 * Execute import with throttled queue and retries
 */
export async function executeImport(
  cma: PlainClientAPI,
  spaceId: string,
  environmentId: string,
  contentTypeId: string,
  mode: ImportMode,
  rows: ParsedRow[],
  mappings: ColumnMapping[],
  contentType: ContentTypeMeta,
  defaultLocale: string,
  shouldPublish: boolean,
  matchedEntries: Map<number, string>, // rowIndex -> entryId for updates
  onProgress?: (completed: number, total: number) => void,
  signal?: AbortSignal
): Promise<ExecutionOutcome> {
  const outcome: ExecutionOutcome = {
    created: 0,
    updated: 0,
    published: 0,
    failed: [],
  };

  // Create queue with concurrency limit
  const queue = new PQueue({ concurrency: 4 });

  // Prepare tasks
  const tasks: ImportTask[] = [];
  for (const row of rows) {
    const fieldValues = resolveFieldValues(row, mappings, contentType, defaultLocale);
    const fields = buildFieldsPayload(fieldValues);

    const task: ImportTask = {
      rowIndex: row.rowIndex,
      fields,
    };

    if (mode === 'update') {
      const entryId = matchedEntries.get(row.rowIndex);
      if (entryId) {
        task.entryId = entryId;
      }
    }

    tasks.push(task);
  }

  let completed = 0;
  const total = tasks.length;

  // Process tasks
  const results = await Promise.all(
    tasks.map((task) =>
      queue.add(async () => {
        // Check if aborted
        if (signal?.aborted) {
          throw new Error('Import cancelled');
        }

        const result = await executeTask(
          cma,
          spaceId,
          environmentId,
          contentTypeId,
          mode,
          task,
          shouldPublish
        );

        completed++;
        if (onProgress) {
          onProgress(completed, total);
        }

        return result;
      })
    )
  );

  // Aggregate results
  for (const result of results) {
    if (result.success) {
      if (mode === 'create') {
        outcome.created++;
      } else {
        outcome.updated++;
      }

      if (shouldPublish && result.entryId) {
        // Check if published (we attempt to publish in executeTask)
        outcome.published++;
      }
    } else {
      outcome.failed.push({
        rowIndex: result.rowIndex,
        reason: result.error || 'Unknown error',
        entryId: result.entryId,
      });
    }
  }

  return outcome;
}

/**
 * Execute a single import task with retry logic
 */
async function executeTask(
  cma: PlainClientAPI,
  spaceId: string,
  environmentId: string,
  contentTypeId: string,
  mode: ImportMode,
  task: ImportTask,
  shouldPublish: boolean,
  maxRetries = 3
): Promise<ImportResult> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (mode === 'create') {
        return await createEntry(cma, spaceId, environmentId, contentTypeId, task, shouldPublish);
      } else {
        return await updateEntry(cma, spaceId, environmentId, task, shouldPublish);
      }
    } catch (error: any) {
      lastError = error;

      // Check if it's a rate limit error (429) or server error (5xx)
      const status = error?.status || error?.response?.status;
      if (status === 429 || (status >= 500 && status < 600)) {
        // Exponential backoff
        const delay = 500 * Math.pow(2, attempt);
        await sleep(delay);
        continue; // Retry
      } else {
        // Other errors - don't retry
        break;
      }
    }
  }

  // All retries failed
  return {
    rowIndex: task.rowIndex,
    success: false,
    entryId: task.entryId,
    error: lastError?.message || 'Unknown error',
  };
}

/**
 * Create a new entry
 */
async function createEntry(
  cma: PlainClientAPI,
  spaceId: string,
  environmentId: string,
  contentTypeId: string,
  task: ImportTask,
  shouldPublish: boolean
): Promise<ImportResult> {
  try {
    // Create entry
    const entry = await cma.entry.create(
      {
        spaceId,
        environmentId,
        contentTypeId,
      },
      {
        fields: task.fields,
      }
    );

    // Publish if requested
    if (shouldPublish) {
      try {
        await cma.entry.publish(
          {
            spaceId,
            environmentId,
            entryId: entry.sys.id,
          },
          entry
        );
      } catch (publishError) {
        // Entry created but not published - still count as success
        console.warn(`Entry created but publish failed for row ${task.rowIndex}:`, publishError);
      }
    }

    return {
      rowIndex: task.rowIndex,
      success: true,
      entryId: entry.sys.id,
    };
  } catch (error: any) {
    throw error;
  }
}

/**
 * Update an existing entry
 */
async function updateEntry(
  cma: PlainClientAPI,
  spaceId: string,
  environmentId: string,
  task: ImportTask,
  shouldPublish: boolean
): Promise<ImportResult> {
  if (!task.entryId) {
    return {
      rowIndex: task.rowIndex,
      success: false,
      error: 'No entry ID for update',
    };
  }

  try {
    // Get current entry
    const entry = await cma.entry.get({
      spaceId,
      environmentId,
      entryId: task.entryId,
    });

    // Merge fields (only update mapped fields)
    const mergedFields = deepMerge(entry.fields, task.fields);

    // Update entry
    const updatedEntry = await cma.entry.update(
      {
        spaceId,
        environmentId,
        entryId: task.entryId,
      },
      {
        ...entry,
        fields: mergedFields,
      }
    );

    // Publish if requested
    if (shouldPublish) {
      try {
        await cma.entry.publish(
          {
            spaceId,
            environmentId,
            entryId: updatedEntry.sys.id,
          },
          updatedEntry
        );
      } catch (publishError) {
        // Entry updated but not published - still count as success
        console.warn(`Entry updated but publish failed for row ${task.rowIndex}:`, publishError);
      }
    }

    return {
      rowIndex: task.rowIndex,
      success: true,
      entryId: updatedEntry.sys.id,
    };
  } catch (error: any) {
    throw error;
  }
}

/**
 * Resolve natural key for update mode
 * Returns a map of rowIndex -> entryId
 */
export async function resolveNaturalKeys(
  searchFn: (
    contentTypeId: string,
    fieldId: string,
    value: string,
    locale?: string
  ) => Promise<string[]>,
  contentTypeId: string,
  naturalKeyConfig: NaturalKeyConfig,
  rows: ParsedRow[],
  mappings: ColumnMapping[]
): Promise<Map<number, string>> {
  const matchedEntries = new Map<number, string>();

  // Find the column that maps to the natural key field
  const keyMapping = mappings.find((m) => m.fieldId === naturalKeyConfig.fieldId);
  if (!keyMapping) {
    return matchedEntries;
  }

  for (const row of rows) {
    const keyValue = row.raw[keyMapping.columnName];
    if (!keyValue || !keyValue.trim()) {
      continue;
    }

    try {
      const matchingIds = await searchFn(
        contentTypeId,
        naturalKeyConfig.fieldId,
        keyValue.trim(),
        naturalKeyConfig.locale
      );

      if (matchingIds.length === 1) {
        matchedEntries.set(row.rowIndex, matchingIds[0]);
      }
    } catch (error) {
      console.error(`Error resolving natural key for row ${row.rowIndex}:`, error);
    }
  }

  return matchedEntries;
}
