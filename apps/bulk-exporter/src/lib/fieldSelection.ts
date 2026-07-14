import type { ContentType } from './flatten';
import type { FieldPreset } from './preferences';

type Field = ContentType['fields'][number];

const SEMANTIC_FIELD_IDS = ['title', 'name', 'slug', 'summary', 'description', 'headline'];
const TEXT_FIELD_TYPES = new Set(['Symbol', 'Text', 'RichText', 'Date']);
const LINK_FIELD_TYPES = new Set(['Link']);

function isSemanticField(field: Field): boolean {
  return SEMANTIC_FIELD_IDS.includes(field.id.toLowerCase());
}

function isTextField(field: Field): boolean {
  if (TEXT_FIELD_TYPES.has(field.type)) return true;
  if (field.type === 'Array' && field.items?.type === 'Symbol') return true;
  return false;
}

function isLinkField(field: Field): boolean {
  if (LINK_FIELD_TYPES.has(field.type)) return true;
  if (field.type === 'Array' && field.items?.type === 'Link') return true;
  return false;
}

/**
 * Smart defaults: title field + common semantic fields + required Symbol fields.
 * Used when a content type is selected for the first time (no saved prefs).
 */
export function getSmartDefaults(contentType: ContentType): string[] {
  const ids = new Set<string>();

  if (contentType.displayField) {
    ids.add(contentType.displayField);
  }

  for (const field of contentType.fields) {
    if (isSemanticField(field)) {
      ids.add(field.id);
    }
    if (field.required && field.type === 'Symbol') {
      ids.add(field.id);
    }
  }

  return contentType.fields.filter((f) => ids.has(f.id)).map((f) => f.id);
}

/**
 * Apply a preset to a content type's fields.
 */
export function applyPreset(contentType: ContentType, preset: FieldPreset): string[] {
  switch (preset) {
    case 'essentials':
      return getSmartDefaults(contentType);

    case 'content':
      return contentType.fields.filter(isTextField).map((f) => f.id);

    case 'references':
      return contentType.fields.filter(isLinkField).map((f) => f.id);

    case 'all':
      return contentType.fields.map((f) => f.id);

    case 'custom':
      return [];
  }
}

export interface FieldGroup {
  id: 'title' | 'required' | 'optional';
  label: string;
  fields: Field[];
}

/**
 * Group fields into Title / Required / Optional sections, sorted alphabetically.
 */
export function groupFields(contentType: ContentType, searchTerm = ''): FieldGroup[] {
  const term = searchTerm.trim().toLowerCase();
  const matchesSearch = (field: Field): boolean => {
    if (!term) return true;
    return field.name.toLowerCase().includes(term) || field.id.toLowerCase().includes(term);
  };

  const titleField = contentType.displayField
    ? contentType.fields.find((f) => f.id === contentType.displayField)
    : undefined;

  const required = contentType.fields
    .filter((f) => f.required && f.id !== contentType.displayField)
    .filter(matchesSearch)
    .sort((a, b) => a.name.localeCompare(b.name));

  const optional = contentType.fields
    .filter((f) => !f.required && f.id !== contentType.displayField)
    .filter(matchesSearch)
    .sort((a, b) => a.name.localeCompare(b.name));

  const groups: FieldGroup[] = [];

  if (titleField && matchesSearch(titleField)) {
    groups.push({ id: 'title', label: 'Title Field', fields: [titleField] });
  }

  if (required.length > 0) {
    groups.push({ id: 'required', label: 'Required Fields', fields: required });
  }

  if (optional.length > 0) {
    groups.push({ id: 'optional', label: 'Optional Fields', fields: optional });
  }

  return groups;
}

/**
 * Detect which preset matches a given selection (or 'custom' if none does).
 */
export function detectPreset(contentType: ContentType, selectedFields: string[]): FieldPreset {
  const sorted = [...selectedFields].sort();
  const presets: FieldPreset[] = ['essentials', 'content', 'references', 'all'];

  for (const preset of presets) {
    const presetFields = [...applyPreset(contentType, preset)].sort();
    if (presetFields.length === sorted.length && presetFields.every((id, i) => id === sorted[i])) {
      return preset;
    }
  }

  return 'custom';
}
