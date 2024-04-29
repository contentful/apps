import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useError } from './useError';
import { errorMessages } from '@constants/errorMessages';

describe('useError', () => {
  it('should return correct error message and error status when error exists', async () => {
    const authError = { invalidToken: true, invalidTeamScope: false, expiredToken: false };

    renderHook(() => {
      const { isError, message } = useError(authError);
      expect(message).toBe(errorMessages.invalidToken);
      expect(isError).toBe(true);
    });
  });

  it('should return no error message and false error status when error does not exist', async () => {
    const authError = { invalidToken: false, invalidTeamScope: false, expiredToken: false };

    renderHook(() => {
      const { isError, message } = useError(authError);
      expect(message).toBeFalsy();
      expect(isError).toBe(false);
    });
  });
});
