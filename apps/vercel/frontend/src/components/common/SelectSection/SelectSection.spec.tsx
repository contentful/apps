import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AppInstallationParameters } from '@customTypes/configPage';
import { SelectSection } from './SelectSection';
import { copies } from '@constants/copies';
import { actions, singleSelectionSections } from '@constants/enums';
import { renderConfigPageComponent } from '@test/helpers/renderConfigPageComponent';

const parameters = { selectedApiPath: '', selectedProject: '' } as AppInstallationParameters;
const paths = [{ id: 'path-1', name: 'Path/1' }];
const projects = [
  { id: 'project-1', name: 'Project 1', targets: { production: { id: 'project-1' } } },
];

describe.only('SelectSection', () => {
  it('renders list of api paths to select', () => {
    const ID = singleSelectionSections.API_PATH_SELECTION_SECTION;
    const { placeholder, errorMessage } = copies.configPage.pathSelectionSection;
    const { unmount } = render(
      <SelectSection
        options={paths}
        section={ID}
        id={ID}
        action={actions.APPLY_API_PATH}
        selectedOption={parameters.selectedApiPath}
      />
    );
    const select = screen.getByText(placeholder);
    expect(select).toBeTruthy();

    select.click();

    expect(screen.getByText(paths[0].name)).toBeTruthy();
    expect(screen.queryByText(errorMessage)).toBeFalsy();
    unmount();
  });

  it('renders list of projects to select', async () => {
    const user = userEvent.setup();

    const mockHandleAppConfigurationChange = vi.fn();
    const ID = singleSelectionSections.PROJECT_SELECTION_SECTION;
    const { placeholder, helpText, errorMessage } = copies.configPage.projectSelectionSection;
    const { unmount } = renderConfigPageComponent(
      <SelectSection
        options={projects}
        section={ID}
        id={ID}
        action={actions.APPLY_API_PATH}
        selectedOption={parameters.selectedApiPath}
      />,
      { handleAppConfigurationChange: mockHandleAppConfigurationChange }
    );
    const select = screen.getByText(placeholder);
    expect(select).toBeTruthy();
    expect(screen.getByText(helpText)).toBeTruthy();
    expect(screen.queryByText(errorMessage)).toBeFalsy();

    user.click(select);
    expect(screen.getByText(projects[0].name)).toBeTruthy();

    user.selectOptions(screen.getByTestId('optionsSelect'), projects[0].name);
    await waitFor(() => expect(mockHandleAppConfigurationChange).not.toBeCalled());
    unmount();
  });

  it('renders error message when selected option no longer exists', () => {
    const ID = singleSelectionSections.PROJECT_SELECTION_SECTION;
    const { errorMessage } = copies.configPage.projectSelectionSection;
    const { unmount } = render(
      <SelectSection
        options={projects}
        section={ID}
        id={ID}
        action={actions.APPLY_API_PATH}
        selectedOption={'non-existent-id'}
      />
    );

    expect(screen.getByText(errorMessage)).toBeTruthy();
    unmount();
  });
});
