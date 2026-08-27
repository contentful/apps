import { useMemo, useState, useCallback } from 'react';
import Fuse from 'fuse.js';
import type { IconCatalogEntry } from '../types/icon';

interface UseIconSearchOptions {
  /** The icon catalog to search */
  catalog: IconCatalogEntry[];
  /** Minimum characters before search activates */
  minSearchLength?: number;
}

interface UseIconSearchResult {
  /** Current search query */
  query: string;
  /** Set the search query */
  setQuery: (query: string) => void;
  /** Filtered icons based on search query */
  results: IconCatalogEntry[];
  /** Whether search is currently active */
  isSearching: boolean;
}

/**
 * Hook for fuzzy searching through the icon catalog using Fuse.js
 * Searches on icon name and tags
 */
export function useIconSearch({
  catalog,
  minSearchLength = 2,
}: UseIconSearchOptions): UseIconSearchResult {
  const [query, setQuery] = useState('');

  // Create Fuse instance with search configuration
  const fuse = useMemo(() => {
    return new Fuse(catalog, {
      keys: [
        { name: 'name', weight: 2 },
        { name: 'componentName', weight: 1.5 },
        { name: 'tags', weight: 1 },
      ],
      threshold: 0.3, // Lower = more strict matching
      includeScore: true,
      minMatchCharLength: minSearchLength,
      ignoreLocation: true,
    });
  }, [catalog, minSearchLength]);

  const isSearching = query.length >= minSearchLength;

  // Perform search and return results
  const results = useMemo(() => {
    if (!isSearching) {
      return catalog;
    }

    const searchResults = fuse.search(query);
    return searchResults.map((result) => result.item);
  }, [query, fuse, catalog, isSearching]);

  const handleSetQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  return {
    query,
    setQuery: handleSetQuery,
    results,
    isSearching,
  };
}
