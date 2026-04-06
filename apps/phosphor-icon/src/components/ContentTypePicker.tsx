import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Checkbox, Flex, Pill, Text } from '@contentful/f36-components';
import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from '@contentful/f36-icons';
import {
  checkboxRowStyles,
  containerStyles,
  dropdownStyles,
  emptyStateStyles,
  regularWeightTextStyles,
  searchContainerStyles,
  searchIconWrapperStyles,
  searchInputStyles,
  searchRowStyles,
  triggerStyles,
  triggerTextStyles,
} from './ContentTypePicker.styles';

interface ContentTypeOption {
  id: string;
  name: string;
}

interface ContentTypePickerProps {
  contentTypes: ContentTypeOption[];
  selectedContentTypeIds: string[];
  onSelectionChange: (contentTypeIds: string[]) => void;
}

function ContentTypePicker({
  contentTypes,
  selectedContentTypeIds,
  onSelectionChange,
}: ContentTypePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedContentTypes = useMemo(() => {
    return selectedContentTypeIds
      .map((id) => contentTypes.find((contentType) => contentType.id === id))
      .filter(Boolean) as ContentTypeOption[];
  }, [contentTypes, selectedContentTypeIds]);

  const filteredContentTypes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return contentTypes;
    }

    return contentTypes.filter((contentType) =>
      contentType.name.toLowerCase().includes(normalizedQuery)
    );
  }, [contentTypes, query]);

  const triggerLabel = useMemo(() => {
    if (selectedContentTypes.length === 0) {
      return 'Select one or more';
    }

    if (selectedContentTypes.length === 1) {
      return selectedContentTypes[0].name;
    }

    return `${selectedContentTypes[0].name} and ${selectedContentTypes.length - 1} more`;
  }, [selectedContentTypes]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const toggleContentType = (contentTypeId: string) => {
    const isSelected = selectedContentTypeIds.includes(contentTypeId);

    onSelectionChange(
      isSelected
        ? selectedContentTypeIds.filter((id) => id !== contentTypeId)
        : [...selectedContentTypeIds, contentTypeId]
    );
  };

  const areAllFilteredSelected =
    filteredContentTypes.length > 0 &&
    filteredContentTypes.every((contentType) => selectedContentTypeIds.includes(contentType.id));

  const toggleAllFiltered = () => {
    if (areAllFilteredSelected) {
      const filteredIds = new Set(filteredContentTypes.map((contentType) => contentType.id));
      onSelectionChange(selectedContentTypeIds.filter((id) => !filteredIds.has(id)));
      return;
    }

    const nextIds = new Set(selectedContentTypeIds);
    filteredContentTypes.forEach((contentType) => nextIds.add(contentType.id));
    onSelectionChange(Array.from(nextIds));
  };

  return (
    <Box ref={containerRef} style={containerStyles}>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((open) => {
            const nextOpen = !open;
            if (!nextOpen) {
              setQuery('');
            }
            return nextOpen;
          });
        }}
        style={triggerStyles}>
        <Flex alignItems="center" justifyContent="space-between">
          <Text style={triggerTextStyles}>{triggerLabel}</Text>
          {isOpen ? <ChevronUpIcon variant="muted" /> : <ChevronDownIcon variant="muted" />}
        </Flex>
      </button>

      {isOpen && (
        <Box style={dropdownStyles}>
          <Box style={searchContainerStyles}>
            <Box style={searchRowStyles}>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search content types"
                style={searchInputStyles}
              />
              <Box style={searchIconWrapperStyles}>
                <SearchIcon variant="muted" />
              </Box>
            </Box>
          </Box>

          {filteredContentTypes.length > 0 && (
            <Box style={checkboxRowStyles}>
              <Checkbox
                isChecked={areAllFilteredSelected}
                onChange={toggleAllFiltered}
                style={regularWeightTextStyles}>
                <span style={regularWeightTextStyles}>Select all</span>
              </Checkbox>
            </Box>
          )}

          {filteredContentTypes.map((contentType) => (
            <Box key={contentType.id} style={checkboxRowStyles}>
              <Checkbox
                isChecked={selectedContentTypeIds.includes(contentType.id)}
                onChange={() => toggleContentType(contentType.id)}
                style={regularWeightTextStyles}>
                <span style={regularWeightTextStyles}>{contentType.name}</span>
              </Checkbox>
            </Box>
          ))}

          {filteredContentTypes.length === 0 && (
            <Box style={emptyStateStyles}>
              <Text fontColor="gray600">No content types match your search.</Text>
            </Box>
          )}
        </Box>
      )}

      <Box marginTop="spacingS">
        <Text fontSize="fontSizeS" fontColor="gray600">
          {selectedContentTypes.length} selected
        </Text>

        {selectedContentTypes.length > 0 && (
          <Flex gap="spacingXs" flexWrap="wrap" marginTop="spacingS">
            {selectedContentTypes.map((contentType) => (
              <Pill
                key={contentType.id}
                label={contentType.name}
                onClose={() =>
                  onSelectionChange(selectedContentTypeIds.filter((id) => id !== contentType.id))
                }
              />
            ))}
          </Flex>
        )}
      </Box>
    </Box>
  );
}

export default ContentTypePicker;
