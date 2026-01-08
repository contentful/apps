/**
 * Shared types for security validation
 */

export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedContent?: string;
}

export interface PromptInjectionPattern {
  name: string;
  patterns: RegExp[];
  description: string;
}
