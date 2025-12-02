import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from './mocks';
import Dialog from '../src/locations/Dialog';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  useAutoResizer: () => {},
}));

describe('Dialog component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dialog with form controls', async () => {
    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Select source locale')).toBeInTheDocument();
      expect(screen.getByText('Select target locales to populate')).toBeInTheDocument();
    });
  });

  it('renders Cancel and Populate fields buttons', async () => {
    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Populate fields')).toBeInTheDocument();
    });
  });

  it('displays source locale select with placeholder', async () => {
    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Select one')).toBeInTheDocument();
    });
  });

  it('displays available locales in source locale select', async () => {
    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('select-locale-en-us')).toBeInTheDocument();
      expect(screen.getAllByText('German').length).toBeGreaterThan(0);
      expect(screen.getAllByText('French').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Spanish (Spain)').length).toBeGreaterThan(0);
    });
  });

  it('renders LocaleMultiSelect component for target locales', async () => {
    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Select one or more')).toBeInTheDocument();
    });
  });

  it('close the dialog when Cancel button is clicked', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockSdk.close).toHaveBeenCalledTimes(1);
  });

  it('allows selecting a source locale', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Select one')).toBeInTheDocument();
    });

    const selectButton = screen.getByTestId('source-locale-select');
    await user.click(selectButton);

    await waitFor(() => {
      expect(screen.getByTestId('select-locale-en-us')).toBeInTheDocument();
    });
  });

  it('does not show error message when locales are available', async () => {
    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.queryByText('No locales found')).not.toBeInTheDocument();
    });
  });
});
