# Content Security Module

This module provides comprehensive security validation to prevent code injection and prompt injection attacks when processing Google Docs content.

## Overview

The security module validates content at multiple stages of the document processing pipeline:

1. **Before AI Processing**: Validates Google Docs JSON structure and content
2. **After AI Processing**: Validates parsed entries returned from the AI agent
3. **Before Contentful Creation**: Final validation before creating entries in Contentful

## Security Features

### Code Injection Prevention

Detects and prevents various code injection attacks:

- **JavaScript Injection**: Script tags, event handlers, `javascript:` protocol, `eval()`, `Function()` constructor, `innerHTML` assignments
- **HTML Injection**: iframe tags, object/embed tags
- **SQL Injection**: SQL command patterns (warnings)
- **Data URI Attacks**: Malicious data URIs containing scripts

### Prompt Injection Prevention

Detects and prevents prompt injection attacks:

- **Instruction Override**: Attempts to ignore, forget, or override system instructions
- **Role Manipulation**: Attempts to change AI role or persona
- **Output Format Manipulation**: Attempts to change output format or structure
- **Confidentiality Bypass**: Attempts to extract system instructions or prompts
- **Jailbreak Attempts**: Developer mode, bypass, hack, exploit attempts

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

### Entry Validation

```typescript
import { validateParsedEntries } from './contentSecurity';

const entries = await parseDocumentWithAI(documentJson);
const result = validateParsedEntries(entries);
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
2. Validates parsed entries after receiving from OpenAI

### Entry Service

Security validation is integrated into `entryService.ts`:

1. Final validation before creating entries in Contentful

## Testing

Run tests with:

```bash
npm test -- contentSecurity.test.ts
```

Test cases cover:
- Code injection detection (JavaScript, HTML, SQL)
- Prompt injection detection (instruction override, role manipulation, etc.)
- Object and array validation
- Google Docs JSON structure validation
- Parsed entries validation

## Security Best Practices

1. **Defense in Depth**: Validation occurs at multiple stages
2. **Fail Secure**: Errors block processing, warnings are logged
3. **Content Sanitization**: Dangerous characters are removed
4. **Pattern Detection**: Multiple patterns detect various attack vectors
5. **AI Prompt Hardening**: System prompts include instructions to resist prompt injection

## Limitations

- Pattern-based detection may have false positives/negatives
- New attack vectors may not be detected
- Content sanitization is conservative (may remove some legitimate content)
- Regular updates to patterns are recommended

## Future Enhancements

- Machine learning-based detection
- Custom pattern configuration
- Rate limiting for repeated violations
- Security audit logging
- Integration with security monitoring systems

