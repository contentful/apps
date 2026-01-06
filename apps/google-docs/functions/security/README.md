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

### Content Sanitization

Ensures data integrity by removing dangerous characters:

- **Null Bytes**: Removed to prevent JSON parsing errors and database issues
- **Control Characters**: Removed (except newlines and tabs) to prevent API call failures

## Usage

### Basic Validation

```typescript
import { validateContentSecurity } from './contentSecurity';

const result = validateContentSecurity(userContent);
if (!result.isValid) {
  console.error('Security validation failed:', result.errors);
  // Handle error
}
```

### Document Validation

```typescript
import { validateGoogleDocJson } from './contentSecurity';

const documentJson = await fetchGoogleDocAsJson({ documentId, oauthToken });
const result = validateGoogleDocJson(documentJson);
if (!result.isValid) {
  throw new Error(`Security validation failed: ${result.errors.join('; ')}`);
}
```

## Validation Results

All validation functions return a `SecurityValidationResult`:

```typescript
interface SecurityValidationResult {
  isValid: boolean;           // true if no errors found
  errors: string[];           // Critical security issues (blocking)
  warnings: string[];         // Potential security issues (non-blocking)
  sanitizedContent?: string;  // Sanitized version of content (if applicable)
}
```

- **Errors**: Critical security issues that should block processing
- **Warnings**: Potential security issues that should be logged but may not block processing

## Integration Points

### Document Parser Agent

Security validation is integrated into `documentParser.agent.ts`:

1. Validates document JSON before sending to OpenAI
2. Blocks processing if malicious prompt injection patterns are detected
3. Logs warnings for suspicious but non-critical patterns

## Testing

Run tests with:

```bash
npm test -- contentSecurity.test.ts
```

Test cases cover:
- Prompt injection detection (instruction override, role manipulation, jailbreak attempts, etc.)
- Content sanitization (null bytes, control characters)
- Object and array validation
- Google Docs JSON structure validation
