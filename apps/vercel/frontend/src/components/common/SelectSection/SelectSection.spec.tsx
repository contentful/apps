import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AppInstallationParameters } from '@customTypes/configPage';
import { SelectSection } from './SelectSection';
import { copies } from '@constants/copies';
import { singleSelectionSections } from '@constants/enums';
import { renderConfigPageComponent } from '@test/helpers/renderConfigPageComponent';
import { errorMessages } from '@constants/errorMessages';
import { mockSdk } from '@test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

const parameters = { selectedApiPath: '', selectedProject: '' } as AppInstallationParameters;
const paths = [{ id: 'path-1', name: 'Path/1' }];
const projects = [
  { id: 'project-1', name: 'Project 1', targets: { production: { id: 'project-1' } } },
];

describe('SelectSection', () => {
  it('renders list of api paths to select', () => {
    const ID = singleSelectionSections.API_PATH_SELECTION_SECTION;
    const { placeholder } = copies.configPage.pathSelectionSection;
    const { unmount } = render(
      <SelectSection
        options={paths}
        section={ID}
        id={ID}
        handleNotFoundError={vi.fn()}
        handleChange={vi.fn()}
        selectedOption={parameters.selectedApiPath}
      />
    );
    const select = screen.getByText(placeholder);
    expect(select).toBeTruthy();

    select.click();

    expect(screen.getByText(paths[0].name)).toBeTruthy();
    expect(screen.queryByText(errorMessages.apiPathNotFound)).toBeFalsy();
    unmount();
  });

  it('renders list of projects to select', async () => {
    const user = userEvent.setup();
    const mockHandleAppConfigurationChange = vi.fn();
    const mockHandleChange = vi.fn();
    const ID = singleSelectionSections.PROJECT_SELECTION_SECTION;
    const {
      placeholder,
      helpText: { copy: helpTextCopy },
    } = copies.configPage.projectSelectionSection;
    const { unmount } = renderConfigPageComponent(
      <SelectSection
        options={projects}
        section={ID}
        id={ID}
        handleChange={mockHandleChange}
        handleNotFoundError={vi.fn()}
        selectedOption={parameters.selectedApiPath}
      />,
      { handleAppConfigurationChange: mockHandleAppConfigurationChange }
    );
    const select = screen.getByText(placeholder);
    expect(select).toBeTruthy();
    expect(screen.getByText(helpTextCopy)).toBeTruthy();
    expect(screen.queryByText(errorMessages.projectNotFound)).toBeFalsy();

    user.click(select);
    expect(screen.getByText(projects[0].name)).toBeTruthy();

    user.selectOptions(screen.getByTestId('optionsSelect'), projects[0].name);
    await waitFor(() => expect(mockHandleChange).toBeCalled());
    await waitFor(() => expect(mockHandleAppConfigurationChange).not.toBeCalled());
    unmount();
  });

  it('renders error message when selected option no longer exists', () => {
    const ID = singleSelectionSections.PROJECT_SELECTION_SECTION;
    const projectSelectionError = {
      projectNotFound: true,
      cannotFetchProjects: false,
      invalidSpaceId: false,
      protectionBypassIsDisabled: false,
    };
    const mockHandleInvalidSelectionError = vi.fn(() => {});
    const { unmount } = render(
      <SelectSection
        options={projects}
        section={ID}
        id={ID}
        selectedOption={'non-existent-id'}
        handleChange={vi.fn()}
        handleNotFoundError={mockHandleInvalidSelectionError}
        error={projectSelectionError}
      />
    );

    expect(screen.getByText(errorMessages.projectNotFound)).toBeTruthy();
    expect(mockHandleInvalidSelectionError).toBeCalled();
    unmount();
  });
});
