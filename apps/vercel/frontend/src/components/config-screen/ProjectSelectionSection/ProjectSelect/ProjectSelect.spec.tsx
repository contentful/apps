import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppInstallationParameters } from '@customTypes/configPage';
import { ProjectSelect } from './ProjectSelect';
import { copies } from '@constants/copies';

const parameters = { selectedProject: '' } as AppInstallationParameters;
const { placeholder } = copies.configPage.projectSelectionSection.dropdown;

describe('ProjectSelect', () => {
  it('renders list of projects to select', () => {
    const projects = [
      { id: 'project-1', name: 'Project 1', targets: { production: { id: 'project-1' } } },
    ];
    render(<ProjectSelect dispatch={vi.fn()} parameters={parameters} projects={projects} />);
    const select = screen.getByText(placeholder);
    expect(select).toBeTruthy();

    select.click();

    expect(screen.getByText('Project 1')).toBeTruthy();
  });
});
