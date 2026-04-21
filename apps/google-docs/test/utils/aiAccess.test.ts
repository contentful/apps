import { describe, expect, it } from 'vitest';
import {
  AiAccessDeniedError,
  isAiAccessDeniedError,
  normalizeAiAccessError,
} from '../../src/utils/aiAccess';

describe('aiAccess utils', () => {
  it('detects access denied errors from CMA-style payloads', () => {
    expect(
      isAiAccessDeniedError({
        sys: { id: 'AccessDenied' },
        message: 'Forbidden',
      })
    ).toBe(true);
  });

  it('normalizes 403-style errors into AiAccessDeniedError', () => {
    const error = normalizeAiAccessError({
      status: 403,
      details: { reasons: 'AI features have been temporarily disabled for this space.' },
    });

    expect(error).toBeInstanceOf(AiAccessDeniedError);
    expect(error.message).toContain('temporarily disabled');
  });

  it('leaves non-access-denied errors unchanged', () => {
    const original = new Error('Something else failed');

    expect(normalizeAiAccessError(original)).toBe(original);
  });
});
