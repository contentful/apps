import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import LocaleMultiSelect from '../../src/components/LocaleMultiSelect';
import { mapLocaleNamesToSimplifiedLocales } from '../../src/utils/locales';
import { mockSdk } from '../mocks';

describe('LocaleMultiSelect component', () => {
  const mockAvailableLocales = mapLocaleNamesToSimplifiedLocales(mockSdk.locales.names);

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
});
