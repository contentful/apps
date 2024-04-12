import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppInstallationParameters } from '@customTypes/configPage';
import { SelectSection } from './SelectSection';
import { copies } from '@constants/copies';
import { actions, singleSelectionSections } from '@constants/enums';

const parameters = { selectedApiPath: '' } as AppInstallationParameters;
const { placeholder } = copies.configPage.pathSelectionSection;

describe('SelectSection', () => {
  it('renders list of api paths to select', () => {
    const paths = [{ id: 'path-1', name: 'Path/1' }];
    const ID = singleSelectionSections.API_PATH_SELECTION_SECTION;
    render(
      <SelectSection
        dispatch={vi.fn()}
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
  });

  it('renders list of projects to select', () => {
    const projects = [
      { id: 'project-1', name: 'Project 1', targets: { production: { id: 'project-1' } } },
    ];
    const ID = singleSelectionSections.PROJECT_SELECTION_SECTION;
    render(
      <SelectSection
        dispatch={vi.fn()}
        options={projects}
        section={ID}
        id={ID}
        action={actions.APPLY_API_PATH}
        selectedOption={parameters.selectedApiPath}
      />
    );
    const select = screen.getByText(placeholder);
    expect(select).toBeTruthy();

    select.click();

    expect(screen.getByText(projects[0].name)).toBeTruthy();
  });
});
