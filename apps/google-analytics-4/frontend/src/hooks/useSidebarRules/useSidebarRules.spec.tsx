import React from 'react';
import { render, screen } from '@testing-library/react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeRule } from 'types';
import { useSidebarRules } from './useSidebarRules';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({ useSDK: vi.fn() }));

const localeRule: ContentTypeRule = {
  id: 'rule-1',
  contentTypeId: 'article',
  slugField: 'slug',
  urlPrefix: '',
  enableAdvancedMatching: true,
  pathPattern: '/{locale}/{slug}',
  additionalFieldIds: [],
  matchDimension: 'unifiedPagePathScreen',
  matchType: 'EXACT',
};

const defaultRules = [localeRule];

const TestComponent = ({ rules = defaultRules }: { rules?: ContentTypeRule[] }) => {
  const { validRules, selectedLocale, localeOptions } = useSidebarRules(rules);

  return (
    <>
      <div>selectedLocale: {selectedLocale}</div>
      <div>reportSlug: {validRules[0]?.reportSlug || ''}</div>
      <div>localeOptions: {localeOptions.map((option) => option.label).join('|')}</div>
    </>
  );
};

const createMockSdk = ({ focused, active }: { focused?: string; active?: string[] }) => ({
  parameters: {
    installation: {
      forceTrailingSlash: false,
    },
  },
  locales: {
    available: ['fr-FR', 'en-US', 'de-DE'],
    default: 'en-US',
    names: {
      'fr-FR': 'French',
      'en-US': 'English',
      'de-DE': 'German',
    },
    fallbacks: {},
    optional: {},
    direction: {},
  },
  editor: {
    getLocaleSettings: vi.fn(() => ({ focused, active })),
    onLocaleSettingsChanged: vi.fn((callback) => {
      callback({ focused, active });
      return vi.fn();
    }),
  },
  entry: {
    onSysChanged: vi.fn((callback) => {
      callback({ publishedAt: '2026-04-16T00:00:00.000Z' });
      return vi.fn();
    }),
    fields: {
      slug: {
        locales: ['en-US', 'fr-FR', 'de-DE'],
        getValue: vi.fn((locale?: string) => {
          if (locale === 'de-DE') return 'produkt';
          if (locale === 'fr-FR') return 'produit';
          return 'product';
        }),
        onValueChanged: vi.fn(() => vi.fn()),
      },
    },
  },
});

describe('useSidebarRules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the focused editor locale for locale pattern tokens', async () => {
    vi.mocked(useSDK).mockReturnValue(
      createMockSdk({ focused: 'de-DE', active: ['fr-FR'] }) as any
    );

    render(<TestComponent />);

    expect(await screen.findByText('selectedLocale: de-DE')).toBeVisible();
    expect(await screen.findByText('reportSlug: /de-DE/produkt')).toBeVisible();
  });

  it('falls back to the active editor locale and sorts locale options alphabetically', async () => {
    vi.mocked(useSDK).mockReturnValue(createMockSdk({ active: ['fr-FR'] }) as any);

    render(<TestComponent />);

    expect(await screen.findByText('selectedLocale: fr-FR')).toBeVisible();
    expect(await screen.findByText('reportSlug: /fr-FR/produit')).toBeVisible();
    expect(
      screen.getByText('localeOptions: English (en-US)|French (fr-FR)|German (de-DE)')
    ).toBeVisible();
  });
});
