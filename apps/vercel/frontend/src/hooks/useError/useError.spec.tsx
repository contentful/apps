import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useError } from './useError';
import { errorMessages } from '@constants/errorMessages';
import { renderConfigPageHook as wrapper } from '@test/helpers/renderConfigPageHook';
import { mockSdk, SPACE_ID } from '@test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('useError', () => {
  it('should return correct error message and error status when error exists', async () => {
    const authError = { invalidToken: true, invalidTeamScope: false, expiredToken: false };
    renderHook(
      () => {
        const { isError, message } = useError({ error: authError });
        expect(message).toBe(errorMessages.invalidToken);
        expect(isError).toBe(true);
      },
      { wrapper }
    );
  });

  it('should return no error message and false error status when error does not exist', async () => {
    const authError = { invalidToken: false, invalidTeamScope: false, expiredToken: false };

    renderHook(
      () => {
        const { isError, message } = useError({ error: authError });
        expect(message).toBeFalsy();
        expect(isError).toBe(false);
      },
      { wrapper }
    );
  });

  it('should return error message when error provided includes a contentType', async () => {
    const previewPathError = {
      contentType: 'article',
      invalidPreviewPathFormat: false,
      emptyPreviewPathInput: true,
    };

    renderHook(
      () => {
        const { message } = useError({
          error: previewPathError,
          contentType: previewPathError.contentType,
        });
        expect(message).toBe(errorMessages.emptyPreviewPathInput);
      },
      { wrapper }
    );
  });

  it('should return error message with dynamic spaceId when error is invalidSpaceId', async () => {
    const projectSelectionerror = {
      invalidSpaceId: true,
      projectNotFound: false,
      protectionBypassIsDisabled: false,
      cannotFetchProjects: false,
    };

    renderHook(
      () => {
        const { message } = useError({
          error: projectSelectionerror,
        });
        expect(message).toBe(errorMessages.invalidSpaceId(SPACE_ID));
      },
      { wrapper }
    );
  });
});
