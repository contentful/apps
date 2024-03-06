import Fuse from 'fuse.js';
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

interface Props<T> {
  list: T[];
  searchQuery: string;
  renderListItem: (item: T) => ReactNode;
  searchKeys: string[];
}

/**
 * @description - Higher order component to make a list fuzzy-searchable with fuse.js.  The actual
 * implementation of the search options, as well as the rendering of filtered items is left up to
 * the consumer of this component.
 */
const SearchableList = <T,>({ list, searchQuery, searchKeys, renderListItem }: Props<T>) => {
  const [filteredList, setFilteredList] = useState<T[]>(list);
  const fuseOptions = {
    isCaseSensitive: false,
    keys: searchKeys,
  };

  const fuse = useMemo(
    () => new Fuse(list, fuseOptions),
    [list, searchQuery, searchKeys, fuseOptions]
  );

  const filterList = useCallback(
    (searchPattern: string) => {
      if (searchPattern === '') {
        // revert to default full list of available contentTypes
        setFilteredList(list);
        return;
      }

      const fuseSearchResultObj = fuse.search(searchPattern);
      // extract actual contentType objects from fuse search result object;
      const extractedSearchResults = fuseSearchResultObj.map((result) => result.item);

      setFilteredList(extractedSearchResults);
    },
    [fuse, list, fuseOptions]
  );

  useEffect(() => {
    if (searchQuery || searchQuery === '') {
      filterList(searchQuery);
    }
  }, [list, searchQuery]);

  return (
    <>
      {filteredList.map((item, idx) => {
        return <React.Fragment key={idx}>{renderListItem(item)}</React.Fragment>;
      })}
    </>
  );
};

export default SearchableList;
