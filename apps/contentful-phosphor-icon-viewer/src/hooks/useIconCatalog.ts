import { useMemo } from 'react';
import { icons } from '@phosphor-icons/core';
import type { IconCatalogEntry } from '../types/icon';

/**
 * Hook to load and transform the icon catalog from @phosphor-icons/core
 * Converts the raw icon data into our normalized IconCatalogEntry format
 */
export function useIconCatalog(): IconCatalogEntry[] {
  const catalog = useMemo(() => {
    return icons.map((icon) => ({
      name: icon.name,
      componentName: icon.pascal_name,
      tags: [...icon.tags].filter((tag) => !tag.startsWith('*')), // Filter out special tags like "*new*"
      categories: [...icon.categories],
    }));
  }, []);

  return catalog;
}
