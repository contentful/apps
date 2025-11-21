import Papa from 'papaparse';
import { ContentTypeMeta, FieldMeta, ParsedRow, ImportMode } from './types';
import { downloadCsv, getTimestamp } from './utils';

/**
 * Parse a CSV file into rows
 */
export function parseCSV(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ParsedRow[] = results.data.map((row, index) => ({
          rowIndex: index + 1, // 1-based
          raw: row as Record<string, string>,
        }));
        resolve(rows);
      },
      error: (error) => {
        reject(new Error(`CSV parse error: ${error.message}`));
      },
    });
  });
}

/**
 * Parse a CSV string into rows
 */
export function parseCSVString(csvString: string): ParsedRow[] {
  const results = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
  });

  return results.data.map((row, index) => ({
    rowIndex: index + 1,
    raw: row as Record<string, string>,
  }));
}

/**
 * Convert rows to CSV string
 */
export function rowsToCSV(rows: Array<Record<string, any>>): string {
  if (rows.length === 0) {
    return '';
  }
  return Papa.unparse(rows, {
    header: true,
    skipEmptyLines: true,
  });
}

/**
 * Generate a CSV template for a content type
 */
export function generateTemplate(
  contentType: ContentTypeMeta,
  mode: ImportMode,
  selectedLocale?: string
): string {
  const headers: string[] = [];

  // In update mode, include sys.id column
  if (mode === 'update') {
    headers.push('sys.id');
  }

  // Add columns for each editable field
  const editableFields = contentType.fields.filter((field) => !field.disabled && !field.omitted);

  for (const field of editableFields) {
    if (field.localized && selectedLocale) {
      // If locale is selected, use suffix naming
      headers.push(`${field.id}__${selectedLocale}`);
    } else {
      // Otherwise just use field ID
      headers.push(field.id);
    }
  }

  // Create empty row to show structure
  const emptyRow: Record<string, string> = {};
  headers.forEach((header) => {
    emptyRow[header] = '';
  });

  return rowsToCSV([emptyRow]);
}

/**
 * Download a template CSV for a content type
 */
export function downloadTemplate(
  contentType: ContentTypeMeta,
  mode: ImportMode,
  selectedLocale?: string
): void {
  const csv = generateTemplate(contentType, mode, selectedLocale);
  const filename = `${contentType.id}_${mode}_template_${getTimestamp()}.csv`;
  downloadCsv(csv, filename);
}

/**
 * Export validation errors to CSV
 */
export function exportErrorsCSV(errors: Array<Record<string, any>>): void {
  if (errors.length === 0) {
    return;
  }
  const csv = rowsToCSV(errors);
  const filename = `import_errors_${getTimestamp()}.csv`;
  downloadCsv(csv, filename);
}

/**
 * Export execution results to CSV
 */
export function exportResultsCSV(results: Array<Record<string, any>>): void {
  if (results.length === 0) {
    return;
  }
  const csv = rowsToCSV(results);
  const filename = `import_results_${getTimestamp()}.csv`;
  downloadCsv(csv, filename);
}

/**
 * Get column names from parsed CSV rows
 */
export function getColumnNames(rows: ParsedRow[]): string[] {
  if (rows.length === 0) {
    return [];
  }
  return Object.keys(rows[0].raw);
}

/**
 * Check if a field supports array values
 */
export function isArrayField(field: FieldMeta): boolean {
  return field.type === 'Array';
}

/**
 * Check if a field is a reference field
 */
export function isReferenceField(field: FieldMeta): boolean {
  return field.type === 'Link';
}

/**
 * Split array values from a delimited string
 */
export function splitArrayValue(value: string, delimiter: string): string[] {
  if (!value || value.trim() === '') {
    return [];
  }
  return value
    .split(delimiter)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Check if a column name follows the field__locale pattern
 */
export function hasLocaleSuffix(columnName: string): boolean {
  const parts = columnName.split('__');
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
}

/**
 * Extract field ID and locale from a column name with suffix
 */
export function parseColumnName(columnName: string): {
  fieldId: string;
  locale: string | null;
} {
  if (hasLocaleSuffix(columnName)) {
    const [fieldId, locale] = columnName.split('__');
    return { fieldId, locale };
  }
  return { fieldId: columnName, locale: null };
}
