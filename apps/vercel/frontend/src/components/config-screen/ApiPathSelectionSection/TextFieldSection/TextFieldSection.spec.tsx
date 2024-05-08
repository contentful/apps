import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { TextFieldSection } from './TextFieldSection';
import { copies } from '@constants/copies';
import { renderConfigPageComponent } from '@test/helpers/renderConfigPageComponent';
import { errorMessages } from '@constants/errorMessages';
import { mockSdk } from '@test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('TextFieldSection', () => {
  it('renders text field with value', () => {
    const apiPath = 'api/disable-path';
    const { textInputPlaceholder } = copies.configPage.pathSelectionSection;
    renderConfigPageComponent(<TextFieldSection />, { parameters: { selectedApiPath: apiPath } });

    const input = document.querySelector('input');
    expect(input).toBeTruthy();
    expect(input).toHaveProperty('value', apiPath);
    expect(input).toHaveProperty('placeholder', textInputPlaceholder);
  });

  it('renders error if api paths are empty and there is no saved value', () => {
    const mockDispatchErrors = vi.fn();
    renderConfigPageComponent(<TextFieldSection />, {
      parameters: { selectedApiPath: '' },
      errors: { apiPathSelection: { apiPathsEmpty: true } },
      isLoading: false,
      dispatchErrors: mockDispatchErrors,
    });

    expect(screen.getByText(errorMessages.apiPathsEmpty)).toBeTruthy();
  });

  it('clears any associated errors if there are no paths, but a saved value', () => {
    const apiPath = 'api/disable-path';
    const mockDispatchErrors = vi.fn();
    renderConfigPageComponent(<TextFieldSection />, {
      parameters: { selectedApiPath: apiPath },
      errors: { apiPathSelection: { apiPathsEmpty: true } },
      isLoading: false,
      dispatchErrors: mockDispatchErrors,
    });

    expect(mockDispatchErrors).toHaveBeenCalled();
  });
});
