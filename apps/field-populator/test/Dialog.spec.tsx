import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from './mocks';
import Dialog from '../src/locations/Dialog';

const defaultLocaleNames = { ...mockSdk.locales.names };

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

describe('Dialog component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.locales.names = { ...defaultLocaleNames };
  });

  it('renders the dialog with form controls', async () => {
    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Source locale')).toBeInTheDocument();
      expect(screen.getByText('Target locales')).toBeInTheDocument();
    });
  });

  it('renders Cancel and Next buttons', async () => {
    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
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

  it('shows validation error when trying to proceed without selecting source locale', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    expect(screen.queryByText('Select source locale')).not.toBeInTheDocument();

    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Select source locale')).toBeInTheDocument();
    });
  });

  it('filters target locales to the same family and excludes the source locale', async () => {
    const user = userEvent.setup();
    mockSdk.locales.names = {
      ...mockSdk.locales.names,
      'en-GB': 'English (United Kingdom)',
      'en-CA': 'English (Canada)',
    };

    await act(async () => {
      render(<Dialog />);
    });

    const sourceSelect = screen.getByTestId('source-locale-select');
    await user.selectOptions(sourceSelect, 'en-US');

    const targetTrigger = await screen.findByText('Select one or more');
    await user.click(targetTrigger);

    await waitFor(() => {
      expect(
        screen.getByRole('checkbox', { name: 'English (United Kingdom)' })
      ).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'English (Canada)' })).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('checkbox', { name: 'English (United States)' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'German' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'French' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Spanish (Spain)' })).not.toBeInTheDocument();
  });

  it('shows validation error when trying to proceed without selecting target locales', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    const selectButton = screen.getByTestId('source-locale-select');
    await user.click(selectButton);

    await waitFor(() => {
      expect(screen.getByTestId('select-locale-en-us')).toBeInTheDocument();
    });

    const sourceLocaleOption = screen.getByTestId('select-locale-en-us');
    await user.click(sourceLocaleOption);

    expect(screen.queryByText('Select target locales')).not.toBeInTheDocument();

    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Select target locales')).toBeInTheDocument();
    });
  });

  it('completes the full flow: locale selection, preview, and confirmation', async () => {
    const user = userEvent.setup();
    mockSdk.locales.names = {
      ...mockSdk.locales.names,
      'en-GB': 'English (United Kingdom)',
    };

    await act(async () => {
      render(<Dialog />);
    });

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    const sourceSelect = screen.getByTestId('source-locale-select');
    await user.selectOptions(sourceSelect, 'en-US');

    const targetTrigger = await screen.findByText('Select one or more');
    await user.click(targetTrigger);

    await waitFor(() => {
      expect(
        screen.getByRole('checkbox', { name: 'English (United Kingdom)' })
      ).toBeInTheDocument();
    });

    const targetCheckbox = screen.getByRole('checkbox', { name: 'English (United Kingdom)' });
    await user.click(targetCheckbox);

    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    expect(mockCma.entry.update).not.toHaveBeenCalled();

    // Click Confirm to populate fields
    const confirmButton = screen.getByText('Confirm');
    await user.click(confirmButton);

    // Should show confirmation step with Done button
    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    expect(mockCma.entry.update).toHaveBeenCalled();
  });
});
