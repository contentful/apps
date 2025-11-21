import { FieldMeta, ValidationIssue, IssueSeverity, ContentTypeMeta } from './types';
import { parseBoolean, parseNumber, isValidJson } from './utils';

/**
 * Validate a field value against its field metadata
 */
export function validateFieldValue(
  fieldMeta: FieldMeta,
  value: any,
  rowIndex: number,
  columnName: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check if value is missing for required field
  if (fieldMeta.required && (value === null || value === undefined || value === '')) {
    issues.push({
      rowIndex,
      columnName,
      fieldId: fieldMeta.id,
      severity: 'error',
      message: `Required field "${fieldMeta.name}" is missing`,
      suggestion: 'Provide a value for this field',
    });
    return issues; // Don't continue validation if required field is missing
  }

  // Skip further validation if value is empty and not required
  if (value === null || value === undefined || value === '') {
    return issues;
  }

  // Type-specific validation
  switch (fieldMeta.type) {
    case 'Symbol':
    case 'Text':
      if (typeof value !== 'string') {
        issues.push({
          rowIndex,
          columnName,
          fieldId: fieldMeta.id,
          severity: 'error',
          message: `Expected text value for "${fieldMeta.name}"`,
          suggestion: 'Provide a text value',
        });
      }
      break;

    case 'Number':
      if (typeof value !== 'number') {
        issues.push({
          rowIndex,
          columnName,
          fieldId: fieldMeta.id,
          severity: 'error',
          message: `Expected number value for "${fieldMeta.name}"`,
          suggestion: 'Provide a valid number',
        });
      }
      break;

    case 'Boolean':
      if (typeof value !== 'boolean') {
        issues.push({
          rowIndex,
          columnName,
          fieldId: fieldMeta.id,
          severity: 'error',
          message: `Expected boolean value for "${fieldMeta.name}"`,
          suggestion: 'Use true/false, 1/0, yes/no',
        });
      }
      break;

    case 'RichText':
      // RichText should be valid JSON
      if (typeof value === 'string') {
        if (!isValidJson(value)) {
          issues.push({
            rowIndex,
            columnName,
            fieldId: fieldMeta.id,
            severity: 'error',
            message: `Invalid JSON for RichText field "${fieldMeta.name}"`,
            suggestion: 'Provide valid JSON for RichText content',
          });
        }
      } else if (typeof value !== 'object') {
        issues.push({
          rowIndex,
          columnName,
          fieldId: fieldMeta.id,
          severity: 'error',
          message: `Expected object or JSON string for RichText field "${fieldMeta.name}"`,
          suggestion: 'Provide valid RichText content as JSON',
        });
      }
      break;

    case 'Array':
      if (!Array.isArray(value)) {
        issues.push({
          rowIndex,
          columnName,
          fieldId: fieldMeta.id,
          severity: 'error',
          message: `Expected array value for "${fieldMeta.name}"`,
          suggestion: 'Use delimiter to separate values',
        });
      } else {
        // Validate array items
        value.forEach((item, index) => {
          const itemIssues = validateArrayItem(fieldMeta, item, index, rowIndex, columnName);
          issues.push(...itemIssues);
        });
      }
      break;

    case 'Link':
      // Links should have proper structure
      if (typeof value === 'string') {
        // It's just an ID, which is fine
      } else if (typeof value === 'object' && value.sys) {
        // It's a link object
        if (!value.sys.type || !value.sys.linkType || !value.sys.id) {
          issues.push({
            rowIndex,
            columnName,
            fieldId: fieldMeta.id,
            severity: 'error',
            message: `Invalid link structure for "${fieldMeta.name}"`,
            suggestion: 'Provide entry ID or proper link object',
          });
        }
      } else {
        issues.push({
          rowIndex,
          columnName,
          fieldId: fieldMeta.id,
          severity: 'error',
          message: `Invalid reference value for "${fieldMeta.name}"`,
          suggestion: 'Provide a valid entry ID',
        });
      }
      break;
  }

  // Validate against field validations
  if (fieldMeta.validations && fieldMeta.validations.length > 0) {
    const validationIssues = validateAgainstRules(fieldMeta, value, rowIndex, columnName);
    issues.push(...validationIssues);
  }

  return issues;
}

/**
 * Validate array item against field metadata
 */
function validateArrayItem(
  fieldMeta: FieldMeta,
  item: any,
  itemIndex: number,
  rowIndex: number,
  columnName: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (fieldMeta.itemsType === 'Symbol') {
    if (typeof item !== 'string') {
      issues.push({
        rowIndex,
        columnName,
        fieldId: fieldMeta.id,
        severity: 'error',
        message: `Array item ${itemIndex + 1} should be text`,
        suggestion: 'Provide text values in array',
      });
    }
  } else if (fieldMeta.itemsType === 'Link') {
    // Validate link structure
    if (typeof item === 'string') {
      // Just an ID, which is fine
    } else if (typeof item === 'object' && item.sys) {
      if (!item.sys.type || !item.sys.linkType || !item.sys.id) {
        issues.push({
          rowIndex,
          columnName,
          fieldId: fieldMeta.id,
          severity: 'error',
          message: `Invalid link structure in array item ${itemIndex + 1}`,
          suggestion: 'Provide valid entry IDs',
        });
      }
    } else {
      issues.push({
        rowIndex,
        columnName,
        fieldId: fieldMeta.id,
        severity: 'error',
        message: `Invalid reference in array item ${itemIndex + 1}`,
        suggestion: 'Provide valid entry IDs',
      });
    }
  }

  return issues;
}

/**
 * Validate value against field validation rules (enum, regex, etc.)
 */
function validateAgainstRules(
  fieldMeta: FieldMeta,
  value: any,
  rowIndex: number,
  columnName: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const validation of fieldMeta.validations || []) {
    // Enum validation (in)
    if (validation.in) {
      const allowedValues = validation.in;
      if (!allowedValues.includes(value)) {
        issues.push({
          rowIndex,
          columnName,
          fieldId: fieldMeta.id,
          severity: 'error',
          message: `Value "${value}" is not in allowed list for "${fieldMeta.name}"`,
          suggestion: `Use one of: ${allowedValues.join(', ')}`,
        });
      }
    }

    // Regex validation (regexp)
    if (validation.regexp) {
      const pattern = validation.regexp.pattern;
      if (pattern && typeof value === 'string') {
        const regex = new RegExp(pattern);
        if (!regex.test(value)) {
          issues.push({
            rowIndex,
            columnName,
            fieldId: fieldMeta.id,
            severity: 'error',
            message: `Value "${value}" does not match required pattern for "${fieldMeta.name}"`,
            suggestion: validation.message || 'Check the format requirements',
          });
        }
      }
    }

    // Size validation
    if (validation.size) {
      if (validation.size.min !== undefined) {
        if (
          (typeof value === 'string' || Array.isArray(value)) &&
          value.length < validation.size.min
        ) {
          issues.push({
            rowIndex,
            columnName,
            fieldId: fieldMeta.id,
            severity: 'error',
            message: `Value is too short/small for "${fieldMeta.name}" (min: ${validation.size.min})`,
          });
        }
      }
      if (validation.size.max !== undefined) {
        if (
          (typeof value === 'string' || Array.isArray(value)) &&
          value.length > validation.size.max
        ) {
          issues.push({
            rowIndex,
            columnName,
            fieldId: fieldMeta.id,
            severity: 'error',
            message: `Value is too long/large for "${fieldMeta.name}" (max: ${validation.size.max})`,
          });
        }
      }
    }

    // Range validation (for numbers)
    if (validation.range) {
      if (typeof value === 'number') {
        if (validation.range.min !== undefined && value < validation.range.min) {
          issues.push({
            rowIndex,
            columnName,
            fieldId: fieldMeta.id,
            severity: 'error',
            message: `Value ${value} is below minimum for "${fieldMeta.name}" (min: ${validation.range.min})`,
          });
        }
        if (validation.range.max !== undefined && value > validation.range.max) {
          issues.push({
            rowIndex,
            columnName,
            fieldId: fieldMeta.id,
            severity: 'error',
            message: `Value ${value} exceeds maximum for "${fieldMeta.name}" (max: ${validation.range.max})`,
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Coerce a raw string value to the appropriate type for a field
 */
export function coerceFieldValue(fieldMeta: FieldMeta, rawValue: string): any {
  if (rawValue === null || rawValue === undefined || rawValue.trim() === '') {
    return null;
  }

  const trimmed = rawValue.trim();

  switch (fieldMeta.type) {
    case 'Symbol':
    case 'Text':
      return trimmed;

    case 'Number':
      return parseNumber(trimmed);

    case 'Boolean':
      return parseBoolean(trimmed);

    case 'RichText':
      // Try to parse as JSON
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed; // Return as-is if not valid JSON
      }

    default:
      return trimmed;
  }
}
