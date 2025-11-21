import { useState, useEffect } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';

export interface Locale {
  code: string;
  name: string;
  default: boolean;
  fallbackCode?: string | null;
}

/**
 * Hook to fetch and manage locales
 */
export function useLocales() {
  const sdk = useSDK<PageAppSDK>();
  const [locales, setLocales] = useState<Locale[]>([]);
  const [defaultLocale, setDefaultLocale] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLocales() {
      try {
        setLoading(true);
        setError(null);

        const response = await sdk.cma.locale.getMany({
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
        });

        if (cancelled) return;

        const localeList: Locale[] = response.items.map((locale) => ({
          code: locale.code,
          name: locale.name,
          default: locale.default || false,
          fallbackCode: locale.fallbackCode,
        }));

        setLocales(localeList);

        const defaultLoc = localeList.find((l) => l.default);
        setDefaultLocale(defaultLoc?.code || null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch locales');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchLocales();

    return () => {
      cancelled = true;
    };
  }, [sdk]);

  return { locales, defaultLocale, loading, error };
}
