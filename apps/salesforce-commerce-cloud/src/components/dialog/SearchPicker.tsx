import React, { useState, useEffect } from 'react';

// Contentful Imports
import { Modal } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { DialogAppSDK } from '@contentful/app-sdk';

// Local Imports
import SfccClient from '../../utils/Sfcc';
import SearchBar from './SearchBar';
import ProductSearchResults from './ProductSearchResults';
import CategorySearchResults from './CategorySearchResults';
import { AppInstallationParameters } from '../../locations/ConfigScreen';
import { DialogInvocationParameters } from '../../locations/Dialog';

export const headerHeight = 114;
export const stickyHeaderBreakpoint = 900;
export const height = window.outerHeight - window.outerHeight * 0.3 - headerHeight;

const SearchPicker = () => {
  const sdk = useSDK<DialogAppSDK>();
  const installParameters = sdk.parameters.installation as AppInstallationParameters;
  const { selectMultiple, fieldType, fieldValue, currentData } = sdk.parameters
    .invocation as DialogInvocationParameters;

  const [query, setQuery] = useState<string>('');
  const [queryIsFetching, setQueryIsFetching] = useState<boolean>(false);
  const [selected, setSelected] = useState<string | string[] | undefined>(fieldValue);
  const [selectedData, setSelectedItemsInfo] = useState<any[]>(currentData || []);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const onQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const onSave = () => {
    sdk.close(selected);
  };

  const findSearchResultData = (id: string) => {
    return searchResults.find((item) => {
      return fieldType === 'product' ? item.id === id : `${item.catalogId}:${item.id}` === id;
    });
  };

  const onItemSelect = (id: string) => {
    if (selectMultiple) {
      // Multivalue
      if (!selected?.length) {
        // Empty array, Initial Value
        setSelected([id]);
        setSelectedItemsInfo([findSearchResultData(id)]);
      } else {
        // Array exists, modify it

        const updateSelected = [...selected];
        let updateSelectedData = [];
        const includedIndex = updateSelected.findIndex((item) => item === id);
        if (includedIndex > -1) {
          // Item exists in array, unset it
          updateSelected.splice(includedIndex, 1);
          updateSelectedData = selectedData.filter((item) => {
            return fieldType === 'product' ? item.id === id : `${item.catalogId}:${item.id}` === id;
          });
        } else {
          console.log('Item not found.');
          updateSelected.push(id);
          updateSelectedData = [...selectedData, findSearchResultData(id)];
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
        setSelectedItemsInfo([findSearchResultData(id)]);
      }
    }
  };

  useEffect(() => {
    const timeOutId = setTimeout(() => {
      const client = new SfccClient(installParameters);
      const fetchResults =
        fieldType === 'product' ? client.searchProducts : client.searchCategories;
      if (query.length >= 3) {
        setQueryIsFetching(true);
        fetchResults(query)
          .then((results: any[]) => setSearchResults(results))
          .finally(() => setQueryIsFetching(false));
      } else {
        setQueryIsFetching(true);
        fetchResults()
          .then((results: any[]) => setSearchResults(results))
          .finally(() => setQueryIsFetching(false));
      }
    }, 500);
    return () => clearTimeout(timeOutId);
  }, [fieldType, query, installParameters]);

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
  };

  const SearchResultsComponent =
    fieldType === 'product' ? ProductSearchResults : CategorySearchResults;

  return (
    <Modal.Content>
      <SearchBar {...searchBarProps} />
      {searchResults.length > 0 && (
        <SearchResultsComponent
          searchResults={searchResults}
          fieldType={fieldType}
          onItemSelect={onItemSelect}
          selectedItems={selected}
        />
      )}
    </Modal.Content>
  );
};

export interface SearchResultsProps {
  searchResults: any[];
  fieldType: string;
  onItemSelect: (id: string) => void;
  selectedItems?: string | string[];
}

export interface SearchResultProps {
  result: any;
  fieldType: string;
  selected?: string | string[];
  onItemSelect: (id: string) => void;
}

export default SearchPicker;
