import { useState, useEffect } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';
import { ContentTypeMeta, FieldMeta } from '../lib/types';

/**
 * Hook to fetch and manage content types
 */
export function useContentTypes() {
  const sdk = useSDK<PageAppSDK>();
  const [contentTypes, setContentTypes] = useState<ContentTypeMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchContentTypes() {
      try {
        setLoading(true);
        setError(null);

        const response = await sdk.cma.contentType.getMany({
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
        });

        if (cancelled) return;

        const types: ContentTypeMeta[] = response.items.map((ct) => ({
          id: ct.sys.id,
          name: ct.name,
          displayField: ct.displayField,
          fields: ct.fields.map(
            (field): FieldMeta => ({
              id: field.id,
              name: field.name,
              type: field.type as any,
              linkType: field.linkType as 'Entry' | 'Asset' | undefined,
              localized: field.localized || false,
              required: field.required || false,
              validations: field.validations || [],
              disabled: field.disabled || false,
              omitted: field.omitted || false,
              itemsType: field.items?.type as 'Symbol' | 'Link' | undefined,
              itemsLinkType: field.items?.linkType as 'Entry' | 'Asset' | undefined,
              itemsValidations: field.items?.validations || [],
            })
          ),
        }));

        setContentTypes(types);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch content types');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchContentTypes();

    return () => {
      cancelled = true;
    };
  }, [sdk]);

  return { contentTypes, loading, error };
}
