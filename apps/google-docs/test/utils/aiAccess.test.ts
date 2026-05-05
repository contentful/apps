import { describe, expect, it } from 'vitest';
import {
  AiAccessDeniedError,
  isAiAccessDeniedError,
  normalizeAiAccessError,
} from '../../src/utils/aiAccess';

describe('aiAccess utils', () => {
  it('detects AI access denied only when status, identifier, and message all match', () => {
    expect(
      isAiAccessDeniedError({
        status: 403,
        sys: { id: 'AccessDenied' },
        message: 'AI features have been temporarily disabled for this space.',
      })
    ).toBe(true);
  });

  it('normalizes 403-style errors into AiAccessDeniedError', () => {
    const error = normalizeAiAccessError({
      status: 403,
      sys: { id: 'AccessDenied' },
      details: { reasons: 'AI features have been temporarily disabled for this space.' },
    });

    expect(error).toBeInstanceOf(AiAccessDeniedError);
    expect(error.message).toContain('temporarily disabled');
  });

  it('does not classify generic 403 errors as AI access denied', () => {
    const error = normalizeAiAccessError({
      status: 403,
      message: 'Forbidden',
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(AiAccessDeniedError);
  });

  it('leaves non-access-denied errors unchanged', () => {
    const original = new Error('Something else failed');

    expect(normalizeAiAccessError(original)).toBe(original);
  });
});
