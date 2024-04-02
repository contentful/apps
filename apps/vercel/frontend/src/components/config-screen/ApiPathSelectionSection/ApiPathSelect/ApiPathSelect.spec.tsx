import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppInstallationParameters, Project } from '@customTypes/configPage';
import { ApiPathSelect } from './ApiPathSelect';

const parameters = { selectedApiPath: '' } as AppInstallationParameters;

describe('ApiPathSelect', () => {
  it('renders list of paths to select', () => {
    const paths = [{ id: 'path-1', name: 'Path/1' }];
    render(<ApiPathSelect dispatch={vi.fn()} parameters={parameters} paths={paths} />);
    const select = screen.getByText('Please select a project...');
    expect(select).toBeTruthy();

    select.click();

    expect(screen.getByText('Path/1')).toBeTruthy();
  });

  it('renders message when no paths exist', () => {
    render(<ApiPathSelect dispatch={vi.fn()} parameters={parameters} paths={[]} />);
    const emptyMessage = screen.getByText('No paths currently configured.');

    expect(emptyMessage).toBeTruthy();
  });
});
