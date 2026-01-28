import React, { useState, useEffect, useRef } from 'react';
import { Flex, TextInput, Button, Menu } from '@contentful/f36-components';
import { FunnelSimpleIcon, MagnifyingGlassIcon, CheckIcon } from '@contentful/f36-icons';
import { useDebounce } from 'use-debounce';
import { styles } from './SearchBar.styles';
import { ContentTypeField, FieldFilterValue, FilterOption } from '../types';
import { FieldFilter } from './FieldFilter';
import { fieldFilterValuesToQuery } from '../utils/contentfulQueryUtils';
import StatusFilter from './StatusFilter';
import tokens from '@contentful/f36-tokens';
import { SortMenu } from './SortMenu';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string, fieldFilterValues: FieldFilterValue[]) => void;
  isDisabled?: boolean;
  debounceDelay?: number;
  fields: ContentTypeField[];

  fieldFilterValues: FieldFilterValue[];
  setFieldFilterValues: React.Dispatch<React.SetStateAction<FieldFilterValue[]>>;

  statusOptions: FilterOption[];
  selectedStatuses: FilterOption[];
  setSelectedStatuses: React.Dispatch<React.SetStateAction<FilterOption[]>>;
  clearSelectionState: () => void;
  setActivePage: React.Dispatch<React.SetStateAction<number>>;

  resetFilters: () => void;
  hasActiveFilters: () => boolean;

  sortOption: string;
  setSortOption: React.Dispatch<React.SetStateAction<string>>;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  isDisabled = false,
  debounceDelay = 300,
  fields,

  fieldFilterValues,
  setFieldFilterValues,

  statusOptions,
  selectedStatuses,
  setSelectedStatuses,
  clearSelectionState,
  setActivePage,

  resetFilters,
  hasActiveFilters,

  sortOption,
  setSortOption,
}) => {
  const [inputValue, setInputValue] = useState(searchQuery);
  const [debouncedValue] = useDebounce(inputValue, debounceDelay);
  const prevDebouncedValueRef = useRef<string>(debouncedValue);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const prevFieldFilterValuesRef = useRef<string>('');

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const searchChanged = prevDebouncedValueRef.current !== debouncedValue;
    const fieldFilterQueryString = fieldFilterValuesToQuery(fieldFilterValues).queryString;
    const filtersChanged = prevFieldFilterValuesRef.current !== fieldFilterQueryString;

    if (searchChanged || filtersChanged) {
      onSearchChange(debouncedValue, fieldFilterValues);
      prevDebouncedValueRef.current = debouncedValue;
      prevFieldFilterValuesRef.current = fieldFilterQueryString;
    }
  }, [debouncedValue, onSearchChange, fieldFilterValues]);

  return (
    <Flex flexDirection="column" gap="spacingXs" className={styles.container}>
      {/* <Text fontSize="fontSizeM" fontWeight="fontWeightMedium">
        Search entries
      </Text> */}
      <Flex flexDirection="row" alignItems="center" gap="spacingS">
        <SortMenu
          sortOption={sortOption}
          onSortChange={(newSort) => {
            setSortOption(newSort);
            setActivePage(0);
          }}
          disabled={isDisabled}
        />
        <TextInput
          placeholder="Search"
          icon={<MagnifyingGlassIcon />}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          isDisabled={isDisabled}
        />
        <StatusFilter
          options={statusOptions}
          selectedItems={selectedStatuses}
          disabled={isDisabled}
          setSelectedItems={(statuses) => {
            setSelectedStatuses(statuses);
            setActivePage(0);
            clearSelectionState();
          }}
        />
        <Menu
          isOpen={isMenuOpen}
          onOpen={() => setIsMenuOpen(true)}
          onClose={() => setIsMenuOpen(false)}
          closeOnSelect={false}>
          <Menu.Trigger>
            <Button aria-label="Filter by property" startIcon={<FunnelSimpleIcon />}>
              Fields
            </Button>
          </Menu.Trigger>
          <Menu.List>
            <Menu.Item
              onClick={() => {
                setFieldFilterValues([]);
                setIsMenuOpen(false);
              }}>
              Clear all
            </Menu.Item>
            {fields.map((field) => (
              <Menu.Item
                // isActive={fieldFilterValues.some((f) => f.fieldUniqueId === field.uniqueId)}
                icon={
                  fieldFilterValues.some((f) => f.fieldUniqueId === field.uniqueId) ? (
                    <CheckIcon />
                  ) : (
                    <CheckIcon color={tokens.gray200} />
                  )
                }
                onClick={() => {
                  if (fieldFilterValues.some((f) => f.fieldUniqueId === field.uniqueId)) {
                    setFieldFilterValues(
                      fieldFilterValues.filter((f) => f.fieldUniqueId !== field.uniqueId)
                    );
                  } else {
                    setFieldFilterValues([
                      ...fieldFilterValues,
                      {
                        fieldUniqueId: field.uniqueId,
                        operator: 'in',
                        value: '',
                        contentTypeField: field,
                      },
                    ]);
                  }
                }}
                key={field.uniqueId}>
                {field.name}
              </Menu.Item>
            ))}
          </Menu.List>
        </Menu>
        <Button
          variant="secondary"
          onClick={resetFilters}
          isDisabled={isDisabled || !hasActiveFilters()}>
          Reset filters
        </Button>
      </Flex>

      <div className={styles.fieldFilterListContainer}>
        {fieldFilterValues.map((fieldFilterValue) => (
          <FieldFilter
            key={fieldFilterValue.fieldUniqueId}
            field={fieldFilterValue.contentTypeField}
            setFieldFilterValues={setFieldFilterValues}
          />
        ))}
      </div>
    </Flex>
  );
};
