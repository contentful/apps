# Content Security Module

This module provides security validation focused on preventing prompt injection attacks and ensuring data integrity when processing Google Docs content for AI integration.

## Overview

The security module validates content before sending it to the AI to prevent prompt injection attacks:

1. **Before AI Processing**: Validates Google Docs JSON structure and content for prompt injection patterns and data corruption issues

## Security Features

### Prompt Injection Prevention

Detects and prevents prompt injection attacks:

- **Instruction Override**: Attempts to ignore, forget, disregard, override, or replace system instructions
- **Jailbreak Attempts**: Developer mode, bypass, hack, exploit attempts

```typescript
import { validateGoogleDocJson } from './googleDocsValidator';

const result = validateGoogleDocJson(documentJson);
```

### Content Sanitization

Ensures data integrity by removing dangerous characters:

- **Null Bytes**: Removed to prevent JSON parsing errors and database issues
- **Control Characters**: Removed (except newlines and tabs) to prevent API call failures

```typescript
import { validateContentSecurity } from './contentValidator';

const result = validateContentSecurity(userContent);
```

## Validation Results

All validation functions return a `SecurityValidationResult`:

```typescript
interface SecurityValidationResult {
  isValid: boolean;           // true if no errors found
  errors: string[];           // Security issues that block processing
  sanitizedContent?: string;  // Sanitized version of content (if applicable)
}
```

## Testing

Run all security tests:

```bash
npm test -- security/
```
