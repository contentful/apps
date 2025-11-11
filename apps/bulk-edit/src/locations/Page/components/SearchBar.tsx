import React, { useState, useEffect, useRef } from 'react';
import { Flex, Text, TextInput } from '@contentful/f36-components';
import { MagnifyingGlassIcon } from '@contentful/f36-icons';
import { useDebounce } from 'use-debounce';
import { styles } from './SearchBar.styles';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDisabled?: boolean;
  debounceDelay?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  isDisabled = false,
  debounceDelay = 300,
}) => {
  const [inputValue, setInputValue] = useState(searchQuery);
  const [debouncedValue] = useDebounce(inputValue, debounceDelay);
  const prevDebouncedValueRef = useRef<string>(debouncedValue);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (prevDebouncedValueRef.current !== debouncedValue) {
      onSearchChange(debouncedValue);
      prevDebouncedValueRef.current = debouncedValue;
    }
  }, [debouncedValue, onSearchChange]);

  return (
    <Flex flexDirection="column" gap="spacingM" className={styles.container}>
      <Text fontSize="fontSizeM" fontWeight="fontWeightMedium">
        Search entries
      </Text>
      <TextInput
        placeholder="Search"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        icon={<MagnifyingGlassIcon />}
        isDisabled={isDisabled}
      />
    </Flex>
  );
};
