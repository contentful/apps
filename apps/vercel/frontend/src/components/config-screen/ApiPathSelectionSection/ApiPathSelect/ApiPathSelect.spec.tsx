import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppInstallationParameters } from '@customTypes/configPage';
import { ApiPathSelect } from './ApiPathSelect';
import { copies } from '@constants/copies';

const parameters = { selectedApiPath: '' } as AppInstallationParameters;
const { placeholder } = copies.configPage.pathSelectionSection.dropdown;

describe('ApiPathSelect', () => {
  it('renders list of paths to select', () => {
    const paths = [{ id: 'path-1', name: 'Path/1' }];
    render(<ApiPathSelect dispatch={vi.fn()} parameters={parameters} paths={paths} />);
    const select = screen.getByText(placeholder);
    expect(select).toBeTruthy();

    select.click();

    expect(screen.getByText('Path/1')).toBeTruthy();
  });
});
