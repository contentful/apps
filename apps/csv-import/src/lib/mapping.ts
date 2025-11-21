import { ContentTypeMeta, FieldMeta, ColumnMapping, ParsedRow, FieldValue } from './types';
import { parseColumnName, splitArrayValue } from './csv';
import { coerceFieldValue } from './validation';

/**
 * Get field metadata by ID
 */
export function getFieldById(contentType: ContentTypeMeta, fieldId: string): FieldMeta | null {
  return contentType.fields.find((f) => f.id === fieldId) || null;
}

/**
 * Get editable fields (non-disabled, non-omitted)
 */
export function getEditableFields(contentType: ContentTypeMeta): FieldMeta[] {
  return contentType.fields.filter((f) => !f.disabled && !f.omitted);
}

/**
 * Check if a field supports arrays
 */
export function isArrayField(field: FieldMeta): boolean {
  return field.type === 'Array';
}

/**
 * Check if a field is a reference (Link)
 */
export function isReferenceField(field: FieldMeta): boolean {
  return field.type === 'Link' || (field.type === 'Array' && field.itemsType === 'Link');
}

/**
 * Resolve field values from a parsed row based on mappings
 * Returns array of FieldValue objects with locale information
 */
export function resolveFieldValues(
  row: ParsedRow,
  mappings: ColumnMapping[],
  contentType: ContentTypeMeta,
  defaultLocale: string
): FieldValue[] {
  const fieldValues: FieldValue[] = [];

  for (const mapping of mappings) {
    // Skip unmapped columns
    if (!mapping.fieldId) {
      continue;
    }

    const field = getFieldById(contentType, mapping.fieldId);
    if (!field) {
      continue;
    }

    const rawValue = row.raw[mapping.columnName];
    if (rawValue === undefined) {
      continue;
    }

    // Determine the target locale
    let locale = defaultLocale;
    if (field.localized) {
      if (mapping.targetLocale) {
        locale = mapping.targetLocale;
      } else {
        // Try to extract from column name (e.g., "title__en-US")
        const parsed = parseColumnName(mapping.columnName);
        if (parsed.locale) {
          locale = parsed.locale;
        }
      }
    }

    // Coerce the value based on field type
    let coercedValue: any;

    if (mapping.isArray && field.type === 'Array') {
      // Split array values
      const delimiter = mapping.arrayDelimiter || '|';
      const items = splitArrayValue(rawValue, delimiter);

      if (field.itemsType === 'Symbol') {
        coercedValue = items;
      } else if (field.itemsType === 'Link') {
        // Convert IDs to link objects
        coercedValue = items.map((id) => ({
          sys: {
            type: 'Link',
            linkType: field.itemsLinkType || 'Entry',
            id: id.trim(),
          },
        }));
      } else {
        coercedValue = items;
      }
    } else if (field.type === 'Link') {
      // Single reference
      const id = rawValue.trim();
      if (id) {
        coercedValue = {
          sys: {
            type: 'Link',
            linkType: field.linkType || 'Entry',
            id,
          },
        };
      } else {
        coercedValue = null;
      }
    } else {
      // Scalar value
      coercedValue = coerceFieldValue(field, rawValue);
    }

    fieldValues.push({
      fieldId: field.id,
      locale,
      value: coercedValue,
    });
  }

  return fieldValues;
}

/**
 * Build Contentful entry fields payload from field values
 * Returns object with structure: { fieldId: { locale: value } }
 */
export function buildFieldsPayload(fieldValues: FieldValue[]): Record<string, Record<string, any>> {
  const payload: Record<string, Record<string, any>> = {};

  for (const fv of fieldValues) {
    if (!payload[fv.fieldId]) {
      payload[fv.fieldId] = {};
    }
    payload[fv.fieldId][fv.locale] = fv.value;
  }

  return payload;
}

/**
 * Suggest automatic mappings based on column names and field IDs
 */
export function suggestMappings(
  columnNames: string[],
  contentType: ContentTypeMeta
): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const editableFields = getEditableFields(contentType);

  for (const columnName of columnNames) {
    const parsed = parseColumnName(columnName);
    const { fieldId, locale } = parsed;

    // Try to find matching field
    const field = editableFields.find((f) => f.id === fieldId);

    if (field) {
      mappings.push({
        columnName,
        fieldId: field.id,
        isArray: field.type === 'Array',
        arrayDelimiter: '|',
        targetLocale: locale,
      });
    } else {
      // No match - leave unmapped
      mappings.push({
        columnName,
        fieldId: null,
        isArray: false,
        arrayDelimiter: '|',
        targetLocale: null,
      });
    }
  }

  return mappings;
}

/**
 * Validate that mappings are complete and correct
 */
export function validateMappings(
  mappings: ColumnMapping[],
  contentType: ContentTypeMeta,
  availableLocales: string[]
): string[] {
  const errors: string[] = [];
  const editableFields = getEditableFields(contentType);

  // Check for unmapped columns with suggestions
  const unmapped = mappings.filter((m) => !m.fieldId);
  if (unmapped.length > 0) {
    errors.push(
      `${unmapped.length} column(s) are unmapped: ${unmapped.map((m) => m.columnName).join(', ')}`
    );
  }

  // Check for localized fields missing locale assignment
  for (const mapping of mappings) {
    if (!mapping.fieldId) continue;

    const field = getFieldById(contentType, mapping.fieldId);
    if (!field) continue;

    if (field.localized && !mapping.targetLocale) {
      const parsed = parseColumnName(mapping.columnName);
      if (!parsed.locale) {
        errors.push(
          `Column "${mapping.columnName}" maps to localized field "${field.name}" but has no locale assigned`
        );
      }
    }

    // Check if assigned locale is valid
    if (mapping.targetLocale && !availableLocales.includes(mapping.targetLocale)) {
      errors.push(`Column "${mapping.columnName}" has invalid locale "${mapping.targetLocale}"`);
    }
  }

  // Check for required fields that are not mapped
  const requiredFields = editableFields.filter((f) => f.required);
  for (const field of requiredFields) {
    const isMapped = mappings.some((m) => m.fieldId === field.id);
    if (!isMapped) {
      errors.push(`Required field "${field.name}" (${field.id}) is not mapped to any column`);
    }
  }

  return errors;
}

/**
 * Extract all entry IDs from mapped reference fields in a row
 */
export function extractReferenceIds(
  row: ParsedRow,
  mappings: ColumnMapping[],
  contentType: ContentTypeMeta
): string[] {
  const ids: string[] = [];

  for (const mapping of mappings) {
    if (!mapping.fieldId) continue;

    const field = getFieldById(contentType, mapping.fieldId);
    if (!field) continue;

    // Only process reference fields
    if (field.type === 'Link') {
      const rawValue = row.raw[mapping.columnName];
      if (rawValue && rawValue.trim()) {
        ids.push(rawValue.trim());
      }
    } else if (field.type === 'Array' && field.itemsType === 'Link') {
      const rawValue = row.raw[mapping.columnName];
      if (rawValue && rawValue.trim()) {
        const delimiter = mapping.arrayDelimiter || '|';
        const items = splitArrayValue(rawValue, delimiter);
        ids.push(...items.filter((id) => id && id.trim()));
      }
    }
  }

  return ids;
}
