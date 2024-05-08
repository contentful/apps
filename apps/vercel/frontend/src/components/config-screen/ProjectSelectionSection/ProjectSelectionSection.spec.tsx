import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppInstallationParameters } from '@customTypes/configPage';
import { ProjectSelectionSection } from './ProjectSelectionSection';
import { copies } from '@constants/copies';
import { renderConfigPageComponent } from '@test/helpers/renderConfigPageComponent';
import userEvent from '@testing-library/user-event';
import * as fetchData from '@hooks/useFetchData/useFetchData';
import { mockSdk } from '@test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

const projects = [
  { id: 'project-1', name: 'Project 1', targets: { production: { id: 'project-1' } }, env: [] },
];

describe('ProjectSelectionSection', () => {
  it('renders dropdown when paths are present and no errors are present', () => {
    const { unmount } = renderConfigPageComponent(<ProjectSelectionSection projects={projects} />);

    const select = screen.getByTestId('optionsSelect');
    expect(select).toBeTruthy();
    unmount();
  });

  it('renders no selected value in dropdown when projectNotFound error', () => {
    const mockDispatchParameters = vi.fn();
    const parameters = {
      dispatchParameters: mockDispatchParameters,
    } as unknown as AppInstallationParameters;
    const { unmount } = renderConfigPageComponent(
      <ProjectSelectionSection projects={projects} />,
      parameters
    );

    const emptyInput = screen.getByText(copies.configPage.projectSelectionSection.placeholder);
    expect(emptyInput).toBeTruthy();
    unmount();
  });

  it('handles project selection', async () => {
    const user = userEvent.setup();
    const mockValidation = vi.fn().mockImplementationOnce(() => Promise.resolve());
    vi.spyOn(fetchData, 'useFetchData').mockReturnValue({
      validateProjectEnv: mockValidation,
      validateToken: vi.fn(),
      fetchProjects: vi.fn(),
      fetchApiPaths: vi.fn(),
    });
    const mockHandleAppConfigurationChange = vi.fn();
    const mockDispatchParameters = vi.fn();
    const overrides = {
      dispatchParameters: mockDispatchParameters,
      handleAppConfigurationChange: mockHandleAppConfigurationChange,
      parameters: { teamId: '1234', selectedProject: 'project 2' },
    } as unknown as AppInstallationParameters;

    const { unmount } = renderConfigPageComponent(<ProjectSelectionSection projects={projects} />, {
      ...overrides,
    });

    const selectDropdown = screen.getByTestId('optionsSelect');

    user.selectOptions(selectDropdown, projects[0].name);

    await waitFor(() => expect(mockHandleAppConfigurationChange).toBeCalled());
    await waitFor(() => expect(mockDispatchParameters).toBeCalled());
    await waitFor(() => expect(mockValidation).toBeCalled());
    unmount();
  });
});
