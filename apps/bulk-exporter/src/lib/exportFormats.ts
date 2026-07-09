import * as XLSX from 'xlsx';
import * as yaml from 'js-yaml';
import * as xmljs from 'xml-js';
import { serializeToCSV } from './csv';

export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'xml' | 'yaml';

export interface ExportData {
  rows: Array<Record<string, string | number | boolean | null>>;
  filename: string;
}

/**
 * Excel cells have a hard 32,767 character limit. Anything over crashes the
 * xlsx writer. Trim long string values and append a marker so users can tell
 * the value was truncated. Non-string values are passed through unchanged.
 */
export const XLSX_CELL_CHARACTER_LIMIT = 32_767;
const XLSX_TRUNCATE_AT = 31_900;
const XLSX_TRUNCATE_SUFFIX = ' ...[truncated]';

export function truncateForXlsx<T extends string | number | boolean | null>(value: T): T {
  if (typeof value !== 'string') return value;
  if (value.length <= XLSX_CELL_CHARACTER_LIMIT) return value;
  return (value.slice(0, XLSX_TRUNCATE_AT) + XLSX_TRUNCATE_SUFFIX) as T;
}

function truncateRowsForXlsx(
  rows: ExportData['rows']
): ExportData['rows'] {
  return rows.map(row => {
    const truncated: Record<string, string | number | boolean | null> = {};
    for (const [key, value] of Object.entries(row)) {
      truncated[key] = truncateForXlsx(value);
    }
    return truncated;
  });
}

/**
 * Export data to CSV format
 */
export function exportToCsv(data: ExportData): void {
  const csv = serializeToCSV(data.rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, data.filename);
}

/**
 * Export data to JSON format
 */
export function exportToJson(data: ExportData): void {
  const json = JSON.stringify(data.rows, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, data.filename);
}

/**
 * Export data to XLSX (Excel) format
 */
export function exportToXlsx(data: ExportData): void {
  // Truncate any cell value that exceeds Excel's 32,767-char hard limit so the
  // xlsx writer doesn't throw "Text length must not exceed 32767 characters".
  const safeRows = truncateRowsForXlsx(data.rows);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(safeRows);

  // Cap column-width estimates so a single very-long cell doesn't blow out
  // the column width calculation.
  const columnWidths = Object.keys(safeRows[0] || {}).map(key => ({
    wch: Math.min(
      80,
      Math.max(
        key.length,
        ...safeRows.slice(0, 100).map(row =>
          String(row[key] ?? '').length
        )
      )
    )
  }));
  worksheet['!cols'] = columnWidths;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Entries');
  
  // Generate XLSX file
  const xlsxData = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array',
    compression: true
  });
  
  const blob = new Blob([xlsxData], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  downloadBlob(blob, data.filename);
}

/**
 * Export data to XML format
 */
export function exportToXml(data: ExportData): void {
  // Create XML structure
  const xmlData = {
    _declaration: {
      _attributes: {
        version: '1.0',
        encoding: 'utf-8'
      }
    },
    entries: {
      entry: data.rows.map(row => {
        const entryData: Record<string, any> = {};
        for (const [key, value] of Object.entries(row)) {
          // Convert field names to valid XML element names
          const xmlKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
          entryData[xmlKey] = {
            _text: value !== null && value !== undefined ? String(value) : ''
          };
        }
        return entryData;
      })
    }
  };
  
  const xml = xmljs.js2xml(xmlData, { 
    compact: true, 
    spaces: 2,
    indentAttributes: false
  });
  
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
  downloadBlob(blob, data.filename);
}

/**
 * Export data to YAML format
 */
export function exportToYaml(data: ExportData): void {
  const yamlStr = yaml.dump(data.rows, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    sortKeys: false
  });
  
  const blob = new Blob([yamlStr], { type: 'text/yaml;charset=utf-8;' });
  downloadBlob(blob, data.filename);
}

/**
 * Export data in the specified format
 */
export function exportData(data: ExportData, format: ExportFormat): void {
  switch (format) {
    case 'csv':
      exportToCsv(data);
      break;
    case 'json':
      exportToJson(data);
      break;
    case 'xlsx':
      exportToXlsx(data);
      break;
    case 'xml':
      exportToXml(data);
      break;
    case 'yaml':
      exportToYaml(data);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Get the file extension for a given format
 */
export function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return '.csv';
    case 'json':
      return '.json';
    case 'xlsx':
      return '.xlsx';
    case 'xml':
      return '.xml';
    case 'yaml':
      return '.yaml';
    default:
      return '';
  }
}

/**
 * Get human-readable format name
 */
export function getFormatName(format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return 'CSV';
    case 'json':
      return 'JSON';
    case 'xlsx':
      return 'Excel (XLSX)';
    case 'xml':
      return 'XML';
    case 'yaml':
      return 'YAML';
  }
}

/**
 * Helper function to download a blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
