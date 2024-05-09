import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import { ApiPathSelectionSection } from './ApiPathSelectionSection';
import { renderConfigPageComponent } from '@test/helpers/renderConfigPageComponent';
import { ApiPath, AppInstallationParameters } from '@customTypes/configPage';
import { copies } from '@constants/copies';
import userEvent from '@testing-library/user-event';
import { mockSdk } from '@test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('ApiPathSelectionSection', () => {
  it('renders dropdown when paths are present and no errors are present', () => {
    const paths = [{ id: 'path-1', name: 'Path/1' }];
    const { unmount } = renderConfigPageComponent(<ApiPathSelectionSection paths={paths} />);

    const select = screen.getByTestId('optionsSelect');
    expect(select).toBeTruthy();
    unmount();
  });

  it('renders dropdown when apiPathNotFound error is present', () => {
    const paths = [{ id: 'path-1', name: 'Path/1' }];
    const errors = { apiPathSelection: { apiPathNotFound: true } };
    const { unmount } = renderConfigPageComponent(
      <ApiPathSelectionSection paths={paths} />,
      errors
    );

    const select = screen.getByTestId('optionsSelect');
    expect(select).toBeTruthy();
    unmount();
  });

  it('renders textfield when no paths', () => {
    const paths: ApiPath[] = [];
    const { unmount } = renderConfigPageComponent(<ApiPathSelectionSection paths={paths} />);

    const input = screen.getByTestId('apiPathInput');
    expect(input).toBeTruthy();
    unmount();
  });

  it('renders textfield when invalidDeploymentData error', () => {
    const paths: ApiPath[] = [];
    const errors = { apiPathSelection: { invalidDeploymentData: true } };
    const { unmount } = renderConfigPageComponent(
      <ApiPathSelectionSection paths={paths} />,
      errors
    );

    const input = screen.getByTestId('apiPathInput');
    expect(input).toBeTruthy();
    unmount();
  });

  it('renders textfield when cannotFetchApiPaths error', () => {
    const paths: ApiPath[] = [];
    const errors = { apiPathSelection: { cannotFetchApiPaths: true } };
    const { unmount } = renderConfigPageComponent(
      <ApiPathSelectionSection paths={paths} />,
      errors
    );

    const input = screen.getByTestId('apiPathInput');
    expect(input).toBeTruthy();
    unmount();
  });

  it('renders no selected value in dropdown when apiPathNotFound error', () => {
    const paths = [{ id: 'path-1', name: 'Path/1' }];
    const errors = { apiPathSelection: { apiPathNotFound: true }, selectedApiPath: 'path-1' };
    const { unmount } = renderConfigPageComponent(
      <ApiPathSelectionSection paths={paths} />,
      errors
    );

    const emptyInput = screen.getByText(copies.configPage.pathSelectionSection.placeholder);
    expect(emptyInput).toBeTruthy();
    unmount();
  });

  it('handles path selection', async () => {
    const user = userEvent.setup();

    const paths = [{ id: 'path-1', name: 'Path/1' }];
    const mockDispatchParameters = vi.fn();
    const parameters = {
      dispatchParameters: mockDispatchParameters,
    } as unknown as AppInstallationParameters;
    const { unmount } = renderConfigPageComponent(
      <ApiPathSelectionSection paths={paths} />,
      parameters
    );

    const selectDropdown = screen.getByTestId('optionsSelect');

    user.selectOptions(selectDropdown, paths[0].name);

    await waitFor(() => expect(mockDispatchParameters).toHaveBeenCalled());
    unmount();
  });
});
