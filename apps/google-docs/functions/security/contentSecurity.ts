/**
 * Content Security Module
 *
 * Provides validation and sanitization functions to prevent:
 * 1. Code injection attacks (JavaScript, SQL, HTML, etc.)
 * 2. Prompt injection attacks (attempts to manipulate AI behavior)
 *
 * This module validates content at multiple stages:
 * - Before sending to AI (document content sanitization)
 * - After AI parsing (parsed entry validation)
 * - Before Contentful creation (final validation)
 */

export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedContent?: string;
}

export interface CodeInjectionPattern {
  name: string;
  pattern: RegExp;
  severity: 'error' | 'warning';
  description: string;
}

export interface PromptInjectionPattern {
  name: string;
  patterns: RegExp[];
  severity: 'error' | 'warning';
  description: string;
}

/**
 * Common code injection patterns to detect
 */
const CODE_INJECTION_PATTERNS: CodeInjectionPattern[] = [
  {
    name: 'JavaScript Script Tag',
    pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    severity: 'error',
    description: 'Detected JavaScript script tag',
  },
  {
    name: 'JavaScript Event Handler',
    pattern: /on\w+\s*=\s*["'][^"']*["']/gi,
    severity: 'error',
    description: 'Detected JavaScript event handler (onclick, onerror, etc.)',
  },
  {
    name: 'JavaScript Function Call',
    pattern: /javascript\s*:/gi,
    severity: 'error',
    description: 'Detected javascript: protocol',
  },
  {
    name: 'HTML Injection',
    pattern: /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
    severity: 'error',
    description: 'Detected iframe tag',
  },
  {
    name: 'Object/Embed Tag',
    pattern: /<(object|embed)[\s\S]*?>/gi,
    severity: 'error',
    description: 'Detected object or embed tag',
  },
  {
    name: 'Data URI with Script',
    pattern: /data:\s*text\/html[\s\S]*?base64[\s\S]*?script/gi,
    severity: 'error',
    description: 'Detected data URI containing script',
  },
  {
    name: 'Eval Function',
    pattern: /\beval\s*\(/gi,
    severity: 'error',
    description: 'Detected eval() function call',
  },
  {
    name: 'Function Constructor',
    pattern: /\bnew\s+Function\s*\(/gi,
    severity: 'error',
    description: 'Detected Function constructor',
  },
  {
    name: 'InnerHTML Assignment',
    pattern: /\.innerHTML\s*=\s*["']/gi,
    severity: 'error',
    description: 'Detected innerHTML assignment',
  },
];

/**
 * Common prompt injection patterns to detect
 */
const PROMPT_INJECTION_PATTERNS: PromptInjectionPattern[] = [
  {
    name: 'Ignore Instructions',
    patterns: [
      /ignore\s+(all\s+)?(previous\s+)?(instructions?|directions?|rules?)/gi,
      /forget\s+(all\s+)?(previous\s+)?(instructions?|directions?|rules?)/gi,
      /disregard\s+(all\s+)?(previous\s+)?(instructions?|directions?|rules?)/gi,
    ],
    severity: 'error',
    description: 'Attempt to ignore previous instructions',
  },
  {
    name: 'Override Instructions',
    patterns: [
      /(new|override|replace)\s+(instructions?|directions?|rules?|prompt)/gi,
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
      /(reveal|show|display|output|print|return)\s+(all\s+)?(system|prompt|instructions?|rules?)/gi,
      /(what\s+are\s+)?(your\s+)?(instructions?|prompts?|rules?|directions?)/gi,
    ],
    severity: 'warning',
    description: 'Attempt to extract system instructions',
  },
  {
    name: 'Jailbreak Attempt',
    patterns: [
      /(jailbreak|bypass|hack|exploit)/gi,
      /(developer\s+mode|debug\s+mode|admin\s+mode)/gi,
    ],
    severity: 'error',
    description: 'Potential jailbreak attempt',
  },
];

/**
 * Sanitizes a string by removing or escaping dangerous characters
 * This is a conservative approach - removes potentially dangerous content
 */
function sanitizeString(content: string): string {
  if (typeof content !== 'string') {
    return String(content);
  }

  let sanitized = content;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Validates content for code injection patterns
 */
export function validateCodeInjection(content: string): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof content !== 'string') {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  for (const pattern of CODE_INJECTION_PATTERNS) {
    const matches = content.match(pattern.pattern);
    if (matches) {
      const message = `${pattern.description}: ${pattern.name}`;
      if (pattern.severity === 'error') {
        errors.push(message);
      } else {
        warnings.push(message);
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
 * Comprehensive validation combining code injection and prompt injection checks
 */
export function validateContentSecurity(content: string): SecurityValidationResult {
  const codeInjectionResult = validateCodeInjection(content);
  const promptInjectionResult = validatePromptInjection(content);

  return {
    isValid: codeInjectionResult.isValid && promptInjectionResult.isValid,
    errors: [...codeInjectionResult.errors, ...promptInjectionResult.errors],
    warnings: [...codeInjectionResult.warnings, ...promptInjectionResult.warnings],
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
