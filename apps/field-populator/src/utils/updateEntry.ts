import { CMAClient } from '@contentful/app-sdk';

export interface UpdateResult {
  success: boolean;
  fieldsUpdated: number;
  entriesUpdated: number;
  entryId: string;
  error?: string;
}

const RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 3;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function updateWithRetry<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const isRateLimitError =
      error instanceof Error && 'status' in error && (error as { status: number }).status === 429;

    if (isRateLimitError && retries > 0) {
      await sleep(RETRY_DELAY_MS);
      return updateWithRetry(operation, retries - 1);
    }

    throw error;
  }
}

export async function updateEntryFields(
  cma: CMAClient,
  entryId: string,
  sourceLocale: string,
  targetLocales: string[],
  adoptedFields: Record<string, boolean>
): Promise<UpdateResult> {
  try {
    const entry = await updateWithRetry(() => cma.entry.get({ entryId }));

    let fieldsUpdated = 0;

    for (const [fieldId, isAdopted] of Object.entries(adoptedFields)) {
      if (!isAdopted) {
        continue;
      }

      const sourceValue = entry.fields[fieldId]?.[sourceLocale];

      for (const targetLocale of targetLocales) {
        if (!entry.fields[fieldId]) {
          entry.fields[fieldId] = {};
        }
        entry.fields[fieldId][targetLocale] = sourceValue;
      }

      fieldsUpdated++;
    }

    await updateWithRetry(() => cma.entry.update({ entryId }, entry));

    return {
      success: true,
      fieldsUpdated,
      entriesUpdated: 1,
      entryId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return {
      success: false,
      fieldsUpdated: 0,
      entriesUpdated: 0,
      entryId,
      error: errorMessage,
    };
  }
}
