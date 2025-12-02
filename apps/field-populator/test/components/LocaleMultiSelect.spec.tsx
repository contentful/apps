import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import LocaleMultiSelect from '../../src/components/LocaleMultiSelect';
import { SimplifiedLocale, mapLocaleNamesToSimplifiedLocales } from '../../src/utils/locales';
import { mockSdk } from '../mocks';

describe('LocaleMultiSelect component', () => {
  const mockAvailableLocales = mapLocaleNamesToSimplifiedLocales(mockSdk.locales.names);

  const mockSelectedLocales: SimplifiedLocale[] = [
    mockAvailableLocales[0], // English (United States)
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a placeholder text when no locales are selected', async () => {
    const onSelectionChange = vi.fn();

    await act(async () => {
      render(
        <LocaleMultiSelect
          availableLocales={mockAvailableLocales}
          selectedLocales={[]}
          onSelectionChange={onSelectionChange}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Select one or more')).toBeInTheDocument();
    });
  });

  it('should display selected locales as pills', async () => {
    const onSelectionChange = vi.fn();

    await act(async () => {
      render(
        <LocaleMultiSelect
          availableLocales={mockAvailableLocales}
          selectedLocales={mockAvailableLocales}
          onSelectionChange={onSelectionChange}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('pill-locale-en-us')).toBeInTheDocument();
      expect(screen.getByTestId('pill-locale-de')).toBeInTheDocument();
      expect(screen.getByTestId('pill-locale-fr')).toBeInTheDocument();
      expect(screen.getByTestId('pill-locale-es-es')).toBeInTheDocument();
    });
  });

  it('should show single locale pill when one is selected', async () => {
    const onSelectionChange = vi.fn();

    await act(async () => {
      render(
        <LocaleMultiSelect
          availableLocales={mockAvailableLocales}
          selectedLocales={mockSelectedLocales}
          onSelectionChange={onSelectionChange}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('pill-locale-en-us')).toBeInTheDocument();
    });
  });

  it('should display multiple locale pills when more than one is selected', async () => {
    const onSelectionChange = vi.fn();
    const multipleSelectedLocales = [
      mockAvailableLocales[0], // English (United States)
      mockAvailableLocales[1], // German
    ];

    await act(async () => {
      render(
        <LocaleMultiSelect
          availableLocales={mockAvailableLocales}
          selectedLocales={multipleSelectedLocales}
          onSelectionChange={onSelectionChange}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('pill-locale-en-us')).toBeInTheDocument();
      expect(screen.getByTestId('pill-locale-de')).toBeInTheDocument();
    });
  });
});
