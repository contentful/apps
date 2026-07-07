import { describe, expect, it } from 'vitest';
import {
  AiAccessDeniedError,
  isAiAccessDeniedError,
  normalizeAiAccessError,
} from '../../src/utils/aiAccess';

describe('aiAccess utils', () => {
  it('detects AI access denied when status is 403 and sys.id is AccessDenied', () => {
    expect(
      isAiAccessDeniedError({
        status: 403,
        sys: { id: 'AccessDenied' },
      })
    ).toBe(true);
  });

  it('detects AI access denied regardless of message content', () => {
    expect(
      isAiAccessDeniedError({
        status: 403,
        sys: { id: 'AccessDenied' },
        message: 'google-docs-workflow-agent requires a higher plan',
      })
    ).toBe(true);
  });

  it('normalizes 403+AccessDenied errors into AiAccessDeniedError preserving the reason', () => {
    const error = normalizeAiAccessError({
      status: 403,
      sys: { id: 'AccessDenied' },
      details: { reasons: 'google-docs-workflow-agent is not available for your plan' },
    });

    expect(error).toBeInstanceOf(AiAccessDeniedError);
    expect(error.message).toContain('not available for your plan');
  });

  it('does not classify 403 errors without AccessDenied sys.id as AI access denied', () => {
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
