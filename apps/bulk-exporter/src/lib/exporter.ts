import type { CMAClient } from '@contentful/app-sdk';
import { createThrottler } from './throttle';
import { paginateEntries, getEntryCount } from './paginate';
import { flattenEntries, flattenEntry, type ContentType, type Entry } from './flatten';
import { exportData, getFileExtension, type ExportFormat } from './exportFormats';

export interface ExportOptions {
  contentType: ContentType | null;
  contentTypeId: string;
  locales: string[];
  fields?: string[];
  filters?: Record<string, unknown>;
  filename?: string;
  format?: ExportFormat;
  userMap?: Record<string, string>;
  contentTypeMap?: Record<string, ContentType>;
  /**
   * Optional in-memory sort applied to all rows after fetching, before the
   * file is written. Driven by the user clicking a column header in the
   * results preview so the downloaded file matches what they see.
   */
  sortByColumn?: { column: string; direction: 'asc' | 'desc' };
  /** Client-side status post-filter for statuses the CMA can't distinguish server-side. */
  statusPostFilter?: (entry: Entry) => boolean;
}

function sortRowsByColumn<T extends Record<string, string | number | boolean | null>>(
  rows: T[],
  column: string,
  direction: 'asc' | 'desc'
): T[] {
  const factor = direction === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = a[column];
    const bv = b[column];

    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;

    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * factor;
    }

    return (
      String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' }) *
      factor
    );
  });
}

export interface ExportProgress {
  fetched: number;
  total: number;
  status: 'estimating' | 'fetching' | 'processing' | 'complete' | 'error' | 'cancelled';
  message?: string;
}

export type ProgressCallback = (progress: ExportProgress) => void;

export class Exporter {
  private cma: CMAClient;
  private throttler = createThrottler({
    requestsPerSecond: 8,
    maxConcurrent: 4,
    maxRetries: 3,
  });
  private cancelled = false;

  constructor(cma: CMAClient) {
    this.cma = cma;
  }

  cancel(): void {
    this.cancelled = true;
  }

  async start(options: ExportOptions, onProgress: ProgressCallback): Promise<void> {
    this.cancelled = false;

    try {
      onProgress({
        fetched: 0,
        total: 0,
        status: 'estimating',
        message: 'Estimating entry count...',
      });

      const total = await this.throttler.execute(() =>
        getEntryCount(
          this.cma,
          options.contentTypeId === 'all-content-types' ? undefined : options.contentTypeId,
          options.filters || {}
        )
      );

      if (this.cancelled) {
        onProgress({ fetched: 0, total, status: 'cancelled', message: 'Export cancelled' });
        return;
      }

      if (total === 0) {
        onProgress({ fetched: 0, total: 0, status: 'complete', message: 'No entries found' });
        return;
      }

      onProgress({
        fetched: 0,
        total,
        status: 'fetching',
        message: `Fetching ${total} entries...`,
      });

      const allRows: ReturnType<typeof flattenEntries> = [];
      let fetched = 0;

      const paginator = paginateEntries(
        this.cma,
        {
          contentType:
            options.contentTypeId === 'all-content-types' ? undefined : options.contentTypeId,
          filters: options.filters || {},
        },
        <T>(fn: () => Promise<T>) => this.throttler.execute(fn)
      );

      for await (const batch of paginator) {
        if (this.cancelled) {
          onProgress({ fetched, total, status: 'cancelled', message: 'Export cancelled' });
          return;
        }

        const filteredBatch = options.statusPostFilter
          ? (batch as Entry[]).filter(options.statusPostFilter)
          : (batch as Entry[]);

        let rows: Array<Record<string, string | number | boolean | null>>;
        if (options.contentType) {
          rows = flattenEntries(filteredBatch, {
            contentType: options.contentType,
            locales: options.locales,
            fields: options.fields,
            userMap: options.userMap,
          });
        } else if (options.contentTypeMap) {
          rows = filteredBatch.map((entry) => {
            const contentTypeId = entry.sys.contentType.sys.id;
            const contentType = options.contentTypeMap![contentTypeId];

            if (contentType) {
              return flattenEntry(entry, {
                contentType,
                locales: options.locales,
                fields: options.fields,
                userMap: options.userMap,
              });
            } else {
              const updatedByUserId = entry.sys.updatedBy?.sys.id;
              const updatedByName = updatedByUserId
                ? options.userMap?.[updatedByUserId] || updatedByUserId
                : 'Unknown';

              const row: Record<string, string | number | boolean | null> = {
                'Entry ID': entry.sys.id,
                Created: new Date(entry.sys.createdAt).toISOString().split('T')[0],
                Updated: new Date(entry.sys.updatedAt).toISOString().split('T')[0],
                'Last Updated By': updatedByName,
                Status: entry.sys.publishedVersion ? 'Published' : 'Draft',
                'Content Type': contentTypeId,
              };

              if (entry.fields) {
                for (const [fieldId, fieldValue] of Object.entries(entry.fields)) {
                  row[fieldId] = JSON.stringify(fieldValue);
                }
              }

              return row;
            }
          });
        } else {
          rows = filteredBatch.map((entry) => {
            const updatedByUserId = entry.sys.updatedBy?.sys.id;
            const updatedByName = updatedByUserId
              ? options.userMap?.[updatedByUserId] || updatedByUserId
              : 'Unknown';

            return {
              'Entry ID': entry.sys.id,
              Created: new Date(entry.sys.createdAt).toISOString().split('T')[0],
              Updated: new Date(entry.sys.updatedAt).toISOString().split('T')[0],
              'Last Updated By': updatedByName,
              Status: entry.sys.publishedVersion ? 'Published' : 'Draft',
              'Content Type': entry.sys.contentType.sys.id,
            };
          });
        }

        allRows.push(...rows);
        fetched += batch.length;

        onProgress({
          fetched,
          total,
          status: 'fetching',
          message: `Fetching entries... ${fetched} / ${total}`,
        });
      }

      if (this.cancelled) {
        onProgress({ fetched, total, status: 'cancelled', message: 'Export cancelled' });
        return;
      }

      const format = options.format || 'csv';
      const formatName = format.toUpperCase();

      onProgress({
        fetched,
        total,
        status: 'processing',
        message: `Generating ${formatName}...`,
      });

      const baseFilename = options.filename || `${options.contentTypeId}-export`;
      const extension = getFileExtension(format);
      const filename = baseFilename.endsWith(extension)
        ? baseFilename
        : `${baseFilename}${extension}`;

      const finalRows = options.sortByColumn
        ? sortRowsByColumn(allRows, options.sortByColumn.column, options.sortByColumn.direction)
        : allRows;

      await exportData({ rows: finalRows, filename }, format);

      onProgress({
        fetched,
        total,
        status: 'complete',
        message: `Successfully exported ${fetched} entries as ${formatName}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      onProgress({
        fetched: 0,
        total: 0,
        status: 'error',
        message: `Export failed: ${message}`,
      });
      throw error;
    }
  }
}
