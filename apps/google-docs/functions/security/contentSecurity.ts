/**
 * Content Security Module
 *
 * Provides validation and sanitization functions to prevent:
 * 1. Prompt injection attacks (attempts to manipulate AI behavior)
 * 2. Data corruption (null bytes, control characters)
 *
 * This module validates content at multiple stages:
 * - Before sending to AI (document content sanitization and prompt injection detection)
 * - After AI parsing (parsed entry validation)
 * - Before Contentful creation (final validation)
 */

export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedContent?: string;
}

export interface PromptInjectionPattern {
  name: string;
  patterns: RegExp[];
  severity: 'error' | 'warning';
  description: string;
}

/**
 * Prompt injection patterns to detect and prevent AI manipulation
 */

// Common sub-patterns for maintainability
const INSTRUCTION_TERMS = '(instructions?|directions?|rules?|prompts?)';

const PROMPT_INJECTION_PATTERNS: PromptInjectionPattern[] = [
  {
    name: 'Ignore Instructions',
    patterns: [
      new RegExp(`ignore\\s+(all\\s+)?(previous\\s+)?${INSTRUCTION_TERMS}`, 'gi'),
      new RegExp(`forget\\s+(all\\s+)?(previous\\s+)?${INSTRUCTION_TERMS}`, 'gi'),
      new RegExp(`disregard\\s+(all\\s+)?(previous\\s+)?${INSTRUCTION_TERMS}`, 'gi'),
    ],
    severity: 'error',
    description: 'Attempt to ignore previous instructions',
  },
  {
    name: 'Override Instructions',
    patterns: [
      new RegExp(
        `(new|override|replace)\\s+(all\\s+)?(the\\s+)?((previous|prior)\\s+)?${INSTRUCTION_TERMS}`,
        'gi'
      ),
      /instead\s+(of|do|use|follow)/gi,
    ],
    severity: 'error',
    description: 'Attempt to override instructions',
  },
  {
    name: 'System Prompt Manipulation',
    patterns: [
      /you\s+are\s+(now|nowadays|currently)/gi,
      /(pretend|act|behave)\s+as\s+(if\s+)?you\s+are/gi,
      /(role|persona|identity)\s*[:=]\s*/gi,
    ],
    severity: 'warning',
    description: 'Attempt to manipulate system prompt or role',
  },
  {
    name: 'Output Format Manipulation',
    patterns: [
      /output\s+(format|structure|schema)\s*[:=]/gi,
      /(return|respond|reply)\s+(with|in|using)\s+(a\s+)?(different|new|custom)/gi,
      /(change|modify|alter)\s+(the\s+)?(output|format|response)/gi,
    ],
    severity: 'warning',
    description: 'Attempt to manipulate output format',
  },
  {
    name: 'Confidentiality Bypass',
    patterns: [
      new RegExp(
        `(reveal|show|display|output|print|return)\\s+(all\\s+)?(system|prompt|instructions?|rules?)`,
        'gi'
      ),
      new RegExp(`(what\\s+are\\s+)?(your\\s+)?${INSTRUCTION_TERMS}`, 'gi'),
    ],
    severity: 'warning',
    description: 'Attempt to extract system instructions',
  },
  {
    name: 'Jailbreak Attempt',
    patterns: [
      // Word boundaries prevent false positives like "bypass valve" or "hack together"
      /\b(jailbreak|bypass|hack|exploit)\b/gi,
      /(developer\s+mode|debug\s+mode|admin\s+mode)/gi,
    ],
    severity: 'error',
    description: 'Potential jailbreak attempt',
  },
];

/**
 * Sanitizes a string by removing dangerous characters that could cause data corruption
 */
function sanitizeString(content: string): string {
  if (typeof content !== 'string') {
    return String(content);
  }

  // Remove null bytes (can break JSON parsing and database storage)
  let sanitized = content.replace(/\0/g, '');

  // Remove control characters except newlines and tabs (can break API calls and storage)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Validates content for prompt injection patterns
 */
export function validatePromptInjection(content: string): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof content !== 'string') {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  for (const patternGroup of PROMPT_INJECTION_PATTERNS) {
    for (const pattern of patternGroup.patterns) {
      const matches = content.match(pattern);
      if (matches) {
        const message = `${patternGroup.description}: ${patternGroup.name}`;
        if (patternGroup.severity === 'error') {
          errors.push(message);
        } else {
          warnings.push(message);
        }
        // Only report once per pattern group
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Comprehensive validation for prompt injection and data sanitization
 * This is the main validation function that combines prompt injection detection
 * with content sanitization to ensure safe AI processing.
 */
export function validateContentSecurity(content: string): SecurityValidationResult {
  const { isValid, errors, warnings } = validatePromptInjection(content);

  return {
    isValid,
    errors,
    warnings,
    sanitizedContent: sanitizeString(content),
  };
}

/**
 * Recursively validates all string values in an object
 */
export function validateObjectSecurity(
  obj: unknown,
  path: string = 'root'
): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (obj === null || obj === undefined) {
    return { isValid: true, errors: [], warnings: [] };
  }

  if (typeof obj === 'string') {
    const result = validateContentSecurity(obj);
    if (!result.isValid) {
      errors.push(...result.errors.map((e) => `${path}: ${e}`));
      warnings.push(...result.warnings.map((w) => `${path}: ${w}`));
    }
    return { isValid: result.isValid, errors, warnings };
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const itemResult = validateObjectSecurity(obj[i], `${path}[${i}]`);
      if (!itemResult.isValid) {
        errors.push(...itemResult.errors);
        warnings.push(...itemResult.warnings);
      }
    }
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = path === 'root' ? key : `${path}.${key}`;
      const fieldResult = validateObjectSecurity(value, fieldPath);
      if (!fieldResult.isValid) {
        errors.push(...fieldResult.errors);
        warnings.push(...fieldResult.warnings);
      }
    }
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Primitive types (number, boolean, etc.) are safe
  return { isValid: true, errors: [], warnings: [] };
}

/**
 * Validates Google Docs JSON structure for security issues
 * Recursively validates all string fields in the document structure
 */
export function validateGoogleDocJson(documentJson: unknown): SecurityValidationResult {
  return validateObjectSecurity(documentJson, 'document');
}

/**
 * Validates parsed entries from AI before creating them in Contentful
 */
export function validateParsedEntries(entries: unknown[]): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(entries)) {
    return {
      isValid: false,
      errors: ['Entries must be an array'],
      warnings: [],
    };
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const entryResult = validateObjectSecurity(entry, `entries[${i}]`);

    if (!entryResult.isValid) {
      errors.push(...entryResult.errors);
      warnings.push(...entryResult.warnings);
    }

    // Additional validation for entry structure
    if (entry && typeof entry === 'object') {
      const entryObj = entry as Record<string, unknown>;

      // Validate fields structure
      if ('fields' in entryObj && entryObj.fields) {
        const fieldsResult = validateObjectSecurity(entryObj.fields, `entries[${i}].fields`);
        if (!fieldsResult.isValid) {
          errors.push(...fieldsResult.errors);
          warnings.push(...fieldsResult.warnings);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
