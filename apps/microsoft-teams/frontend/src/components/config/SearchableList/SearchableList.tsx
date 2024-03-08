import Fuse from 'fuse.js';
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

interface Props<T> {
  items: T[];
  pinnedItems?: T[];
  renderListItem: (item: T) => ReactNode;
  searchQuery: string;
  searchKeys: string[];
}

/**
 * @description - Higher order component to make a list fuzzy-searchable with fuse.js.  The actual
 * implementation of the search options, as well as the rendering of filtered items is left up to
 * the consumer of this component.
 */
const SearchableList = <T,>({
  items,
  pinnedItems = [],
  renderListItem,
  searchQuery,
  searchKeys,
}: Props<T>) => {
  const [filteredList, setFilteredList] = useState<T[]>(items);
  const fuseOptions = {
    isCaseSensitive: false,
    keys: searchKeys,
  };

  const fuse = useMemo(
    () => new Fuse(items, fuseOptions),
    [items, searchQuery, searchKeys, fuseOptions]
  );

  const filterList = useCallback(
    (searchPattern: string) => {
      if (searchPattern === '') {
        const uniqueDefaultSet = new Set([...pinnedItems, ...items]);

        // revert to default full list of available contentTypes
        setFilteredList([...uniqueDefaultSet]);
        return;
      }

      const fuseSearchResultObj = fuse.search(searchPattern);
      // extract actual contentType objects from fuse search result object;
      const extractedSearchResults = fuseSearchResultObj.map((result) => result.item);
      const uniqueItems = new Set([...pinnedItems, ...extractedSearchResults]);

      setFilteredList([...uniqueItems]);
    },
    [fuse, items, fuseOptions]
  );

  useEffect(() => {
    if (searchQuery || searchQuery === '') {
      filterList(searchQuery);
    }
  }, [items, searchQuery]);

  return (
    <>
      {filteredList.map((item, idx) => {
        return <React.Fragment key={idx}>{renderListItem(item)}</React.Fragment>;
      })}
    </>
  );
};

export default SearchableList;
