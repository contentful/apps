import { OrphanResult } from '../types';

/**
 * CSV export of scan results for offline review. Deliberately broad, like
 * the scan itself: callers pass the tab's FULL cached results — including
 * rows currently hidden by the scope checkboxes or the never-edited view —
 * and the Kind / Edited after creation columns carry the flags, so the
 * filtering can happen in the spreadsheet instead of silently in the export.
 */

/** Space/environment coordinates for building editor deep links. */
export interface CsvLinkContext {
  spaceId: string;
  /** Pass the alias id when browsing under one, like the app's other links. */
  environmentId: string;
}

const CSV_HEADER = [
  'Kind',
  'ID',
  'Title',
  'Type',
  'Created',
  'Created by',
  // Positive phrasing on purpose: a "Never edited" column would put double
  // negatives in the cells ("Never edited: no"). The UI's "Never edited"
  // view is this column filtered to "no".
  'Edited after creation',
  'Editor URL',
];

/**
 * RFC 4180 quoting, plus a guard against spreadsheet formula injection:
 * titles and creator names are content-controlled text, and Excel/Sheets
 * execute cells starting with = + - or @ as formulas on open. The leading
 * apostrophe is the spreadsheet convention for "treat as literal text".
 */
const escapeCell = (value: string): string => {
  const literal = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(literal) ? `"${literal.replace(/"/g, '""')}"` : literal;
};

/** Editor deep link for one result — entries and assets have separate paths. */
export const editorUrl = (result: OrphanResult, { spaceId, environmentId }: CsvLinkContext) =>
  `https://app.contentful.com/spaces/${spaceId}/environments/${environmentId}/${
    result.kind === 'entry' ? 'entries' : 'assets'
  }/${result.id}`;

export const buildOrphanCsv = (results: OrphanResult[], context: CsvLinkContext): string => {
  const rows = results.map((result) => [
    result.kind,
    result.id,
    // Empty cell, not an "Untitled" placeholder: a spreadsheet filter on
    // blank titles should match exactly the untitled results.
    result.title ?? '',
    result.typeName,
    result.createdAt,
    result.createdBy,
    result.neverEdited ? 'no' : 'yes',
    editorUrl(result, context),
  ]);
  // CRLF line endings per RFC 4180 — some Windows spreadsheet imports
  // mis-detect bare LF files.
  return [CSV_HEADER, ...rows].map((cells) => cells.map(escapeCell).join(',')).join('\r\n');
};

/** Hands the CSV to the browser as a file download. */
export const downloadCsv = (filename: string, csv: string): void => {
  // The UTF-8 BOM makes Excel decode the file as UTF-8; without it,
  // non-ASCII titles open as mojibake.
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  // Firefox ignores clicks on anchors that are not in the document.
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
