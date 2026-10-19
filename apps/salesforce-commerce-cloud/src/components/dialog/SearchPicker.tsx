import React, { useState, useEffect } from 'react';

// Contentful Imports
import { Modal } from '@contentful/f36-components';
import { useSDK, useCMA } from '@contentful/react-apps-toolkit';
import { DialogAppSDK } from '@contentful/app-sdk';

// Local Imports
import SfccClient from '../../utils/Sfcc';
import SearchBar from './SearchBar';
import ProductSearchResults from './ProductSearchResults';
import ListSearchResults from './ListSearchResults';
import { DialogInvocationParameters } from '../../locations/Dialog';
import { FieldType, SfccItem, itemKey } from '../../utils/resources';

export const headerHeight = 114;
export const stickyHeaderBreakpoint = 900;
export const height = window.outerHeight - window.outerHeight * 0.3 - headerHeight;

const SearchPicker = () => {
  const sdk = useSDK<DialogAppSDK>();
  const cma = useCMA();
  const {
    selectMultiple,
    fieldType,
    fieldValue,
    currentData,
    locale,
    siteId,
    catalogId,
    includeVariants,
  } = sdk.parameters.invocation as DialogInvocationParameters;

  const [query, setQuery] = useState<string>('');
  const [queryIsFetching, setQueryIsFetching] = useState<boolean>(false);
  const [selected, setSelected] = useState<string | string[] | undefined>(fieldValue);
  const [selectedData, setSelectedItemsInfo] = useState<SfccItem[]>(currentData || []);
  const [searchResults, setSearchResults] = useState<SfccItem[]>([]);

  const onQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const onSave = () => {
    sdk.close(selected);
  };

  const findSearchResultData = (id: string) => {
    return searchResults.find((item) => itemKey(fieldType, item) === id);
  };

  const onItemSelect = (id: string) => {
    if (selectMultiple) {
      // Multivalue
      if (!selected?.length) {
        // Empty array, Initial Value
        setSelected([id]);
        setSelectedItemsInfo([findSearchResultData(id)].filter(Boolean) as SfccItem[]);
      } else {
        // Array exists, modify it

        const updateSelected = [...selected];
        let updateSelectedData = [];
        const includedIndex = updateSelected.findIndex((item) => item === id);
        if (includedIndex > -1) {
          // Item exists in array, unset it
          updateSelected.splice(includedIndex, 1);
          updateSelectedData = selectedData.filter((item) => itemKey(fieldType, item) !== id);
        } else {
          updateSelected.push(id);
          updateSelectedData = [...selectedData, findSearchResultData(id)].filter(
            Boolean
          ) as SfccItem[];
        }

        setSelected(updateSelected);
        setSelectedItemsInfo(updateSelectedData);
      }
    } else {
      // Single value
      if (selected === id) {
        setSelected('');
        setSelectedItemsInfo([]);
      } else {
        setSelected(id);
        setSelectedItemsInfo([findSearchResultData(id)].filter(Boolean) as SfccItem[]);
      }
    }
  };

  useEffect(() => {
    const timeOutId = setTimeout(() => {
      const client = new SfccClient(cma, sdk.ids, { siteId, catalogId, includeVariants });
      setQueryIsFetching(true);
      client
        .search(fieldType, query.length >= 3 ? query : undefined)
        .then((results) => setSearchResults(results))
        .catch((error: Error) => {
          setSearchResults([]);
          sdk.notifier.error(error.message);
        })
        .finally(() => setQueryIsFetching(false));
    }, 500);
    return () => clearTimeout(timeOutId);
  }, [fieldType, query]);

  const searchBarProps = {
    isLoading: queryIsFetching,
    query: query,
    onQueryChange: onQueryChange,
    onSave: onSave,
    stickyHeaderBreakpoint: stickyHeaderBreakpoint,
    saveIsDisabled: !selected?.length,
    selectedItems: selected,
    selectedData: selectedData,
    removeSelected: onItemSelect,
    locale,
  };

  const SearchResultsComponent = fieldType === 'product' ? ProductSearchResults : ListSearchResults;

  return (
    <Modal.Content>
      <SearchBar {...searchBarProps} />
      {searchResults.length > 0 && (
        <SearchResultsComponent
          searchResults={searchResults}
          fieldType={fieldType}
          onItemSelect={onItemSelect}
          selectedItems={selected}
          locale={locale}
        />
      )}
    </Modal.Content>
  );
};

export interface SearchResultsProps {
  searchResults: SfccItem[];
  fieldType: FieldType;
  onItemSelect: (id: string) => void;
  selectedItems?: string | string[];
  locale?: string;
}

export interface SearchResultProps {
  result: SfccItem;
  fieldType: FieldType;
  locale?: string;
  selected?: string | string[];
  onItemSelect: (id: string) => void;
}

export default SearchPicker;
