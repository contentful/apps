import Papa from 'papaparse';
import type { FlatRow } from './flatten';

export interface CsvOptions {
  filename?: string;
  includeHeaders?: boolean;
  headers?: string[];
}

export function serializeToCSV(rows: FlatRow[], options: CsvOptions = {}): string {
  const { includeHeaders = true, headers } = options;

  const csv = Papa.unparse(rows, {
    header: includeHeaders,
    columns: headers,
  });

  return '\uFEFF' + csv;
}

export function downloadCSV(csv: string, filename: string = 'export.csv'): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCSV(rows: FlatRow[], filename: string, headers?: string[]): void {
  const csv = serializeToCSV(rows, {
    includeHeaders: true,
    headers,
  });

  downloadCSV(csv, filename);
}
