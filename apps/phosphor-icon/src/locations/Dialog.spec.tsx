import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { DialogAppSDK } from '@contentful/app-sdk';
import Dialog from './Dialog';
import { createMockDialogSdk } from '../../test/mocks/mockSdk';

let mockSdk: DialogAppSDK;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Dialog', () => {
  beforeEach(() => {
    mockSdk = createMockDialogSdk({
      invocationParameters: {
        enabledWeights: ['regular', 'bold'],
        positionOptions: ['start', 'end'],
        currentValue: {
          name: 'airplane',
          componentName: 'Airplane',
          weight: 'regular',
          position: 'start',
        },
      },
    });
  });

  it('renders the single-icon dialog heading', () => {
    render(<Dialog />);

    expect(screen.getByText('Select a Phosphor Icon')).toBeInTheDocument();
  });

  it('keeps the selected icon while changing weight and position', () => {
    render(<Dialog />);

    fireEvent.change(screen.getByLabelText(/select icon style/i), {
      target: { value: 'bold' },
    });
    fireEvent.change(screen.getByLabelText(/position/i), {
      target: { value: 'end' },
    });
    fireEvent.click(screen.getByRole('button', { name: /select icon/i }));

    expect(mockSdk.close).toHaveBeenCalledWith({
      name: 'airplane',
      componentName: 'Airplane',
      weight: 'bold',
      position: 'end',
    });
  });

  it('returns selected icon names in multi-select mode', () => {
    mockSdk = createMockDialogSdk({
      invocationParameters: {
        mode: 'multi',
        enabledWeights: ['regular'],
        positionOptions: ['start', 'end'],
        selectedIconNames: ['airplane'],
      },
    });

    render(<Dialog />);

    fireEvent.click(screen.getByRole('button', { name: /select anchor icon/i }));
    fireEvent.click(screen.getByRole('button', { name: /save selected icons/i }));

    expect(mockSdk.close).toHaveBeenCalledWith(['airplane', 'anchor']);
  });

  it('shows a style dropdown when the saved style is no longer allowed', () => {
    mockSdk = createMockDialogSdk({
      invocationParameters: {
        enabledWeights: ['regular'],
        positionOptions: ['start', 'end'],
        currentValue: {
          name: 'airplane',
          componentName: 'Airplane',
          weight: 'duotone',
          position: 'start',
        },
      },
    });

    render(<Dialog />);

    const styleSelect = screen.getByLabelText(/select icon style/i) as HTMLSelectElement;
    expect(styleSelect.value).toBe('regular');
    expect(screen.getByRole('option', { name: 'Regular' })).toBeInTheDocument();
  });
});
