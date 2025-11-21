// Core types for CSV Import App
export type ImportMode = 'create' | 'update';

export type IssueSeverity = 'error' | 'warning' | 'info';

// Contentful field types we support
export type SupportedFieldType =
  | 'Symbol'
  | 'Text'
  | 'RichText'
  | 'Number'
  | 'Boolean'
  | 'Array'
  | 'Link';

export interface FieldMeta {
  id: string;
  name: string;
  type: SupportedFieldType;
  linkType?: 'Entry' | 'Asset';
  localized: boolean;
  required: boolean;
  validations?: any[];
  disabled?: boolean;
  omitted?: boolean;
  itemsType?: 'Symbol' | 'Link'; // for Array
  itemsLinkType?: 'Entry' | 'Asset';
  itemsValidations?: any[];
}

export interface ContentTypeMeta {
  id: string;
  name: string;
  displayField?: string;
  fields: FieldMeta[];
}

export interface ColumnMapping {
  columnName: string;
  fieldId: string | null; // unmapped if null
  isArray: boolean;
  arrayDelimiter?: string; // default '|'
  targetLocale?: string | null; // required if field is localized and not using suffix
}

export interface NaturalKeyConfig {
  enabled: boolean;
  fieldId: string; // e.g., 'sku'
  locale?: string; // for localized key fields
}

export interface ParsedRow {
  rowIndex: number; // 1-based for human readability
  raw: Record<string, string>; // columnName -> raw value
}

export interface ValidationIssue {
  rowIndex: number;
  columnName?: string;
  fieldId?: string;
  severity: IssueSeverity;
  message: string;
  suggestion?: string;
}

export interface DryRunResultRow {
  rowIndex: number;
  matchedEntryId?: string; // in update mode
  ok: boolean;
  issues: ValidationIssue[];
}

export interface ExecutionOutcome {
  created: number;
  updated: number;
  published: number;
  failed: Array<{ rowIndex: number; reason: string; entryId?: string }>;
  resultsCsv?: string; // optional exported report
}

// Parsed and validated field value with locale
export interface FieldValue {
  fieldId: string;
  locale: string;
  value: any; // coerced value
}

// ImportConfig holds all settings for an import operation
export interface ImportConfig {
  mode: ImportMode;
  contentTypeId: string;
  shouldPublish: boolean;
  naturalKeyConfig?: NaturalKeyConfig;
  arrayDelimiter: string;
}

// Step state management
export type ImportStep = 'setup' | 'mapping' | 'dryrun' | 'execute' | 'summary';

export interface ImportState {
  currentStep: ImportStep;
  config: ImportConfig;
  contentType: ContentTypeMeta | null;
  csvData: ParsedRow[];
  mappings: ColumnMapping[];
  dryRunResults: DryRunResultRow[];
  executionOutcome: ExecutionOutcome | null;
}
