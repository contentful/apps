export interface ValidationError {
  name: string;
  message: string;
  value?: any;
  params?: Record<string, any>;
}

export interface ValidationResult {
  errors: ValidationError[];
}

export type ValidationConfig = Record<string, any>;
