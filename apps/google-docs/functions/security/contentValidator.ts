/**
 * Content Validator
 *
 * Provides validation and sanitization for general text content to prevent:
 * 1. Prompt injection attacks (attempts to manipulate AI behavior)
 * 2. Data corruption (null bytes, control characters)
 */

import { SecurityValidationResult, PromptInjectionPattern } from './types';

const INSTRUCTION_TERMS = '(instructions?|directions?|rules?|prompts?)';

/**
 * Prompt injection patterns to detect and prevent AI manipulation
 */
const PROMPT_INJECTION_PATTERNS: PromptInjectionPattern[] = [
  {
    name: 'Ignore Instructions',
    patterns: [
      new RegExp(`ignore\\s+(all\\s+)?(previous\\s+)?${INSTRUCTION_TERMS}`, 'gi'),
      new RegExp(`forget\\s+(all\\s+)?(previous\\s+)?${INSTRUCTION_TERMS}`, 'gi'),
      new RegExp(`disregard\\s+(all\\s+)?(previous\\s+)?${INSTRUCTION_TERMS}`, 'gi'),
    ],
    description: 'Attempt to ignore previous instructions',
  },
  {
    name: 'Override Instructions',
    patterns: [
      new RegExp(
        `(new|override|replace)\\s+(all\\s+)?(the\\s+)?((previous|prior)\\s+)?${INSTRUCTION_TERMS}`,
        'gi'
      ),
    ],
    description: 'Attempt to override instructions',
  },
  {
    name: 'Jailbreak Attempt',
    patterns: [
      // Word boundaries prevent false positives like "bypass valve" or "hack together"
      /\b(jailbreak|bypass|hack|exploit)\b/gi,
      /(developer\s+mode|debug\s+mode|admin\s+mode)/gi,
    ],
    description: 'Potential jailbreak attempt',
  },
];

/**
 * Content Validator class for validating and sanitizing text content
 */
export class ContentValidator {
  /**
   * Sanitizes a string by removing dangerous characters that could cause data corruption
   */
  private sanitizeString(content: string): string {
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
  validatePromptInjection(content: string): SecurityValidationResult {
    const errors: string[] = [];

    if (typeof content !== 'string') {
      return {
        isValid: true,
        errors: [],
      };
    }

    for (const patternGroup of PROMPT_INJECTION_PATTERNS) {
      for (const pattern of patternGroup.patterns) {
        const matches = content.match(pattern);
        if (matches) {
          const message = `${patternGroup.description}: ${patternGroup.name}`;
          errors.push(message);
          // Only report once per pattern group
          break;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Comprehensive validation for prompt injection and data sanitization
   * This is the main validation method that combines prompt injection detection
   * with content sanitization to ensure safe AI processing.
   */
  validate(content: string): SecurityValidationResult {
    const { isValid, errors } = this.validatePromptInjection(content);

    return {
      isValid,
      errors,
      sanitizedContent: this.sanitizeString(content),
    };
  }
}

/**
 * Validates content for prompt injection patterns
 * Convenience function that creates a validator instance
 */
export function validatePromptInjection(content: string): SecurityValidationResult {
  const validator = new ContentValidator();
  return validator.validatePromptInjection(content);
}

/**
 * Validates and sanitizes content
 * Convenience function that creates a validator instance
 */
export function validateContentSecurity(content: string): SecurityValidationResult {
  const validator = new ContentValidator();
  return validator.validate(content);
}
