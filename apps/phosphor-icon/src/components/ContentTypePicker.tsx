import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Checkbox, Flex, Pill, Text } from '@contentful/f36-components';
import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from '@contentful/f36-icons';

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
    <Box ref={containerRef} style={{ position: 'relative', width: '100%' }}>
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
        style={{
          width: '100%',
          minHeight: '44px',
          padding: '9px 14px',
          border: '1px solid #cfd9e5',
          borderRadius: '6px',
          backgroundColor: '#ffffff',
          color: '#1a2433',
          cursor: 'pointer',
          textAlign: 'left',
          position: 'relative',
          zIndex: 3,
        }}>
        <Flex alignItems="center" justifyContent="space-between">
          <Text style={{ fontSize: '14px', lineHeight: '20px', fontWeight: 400 }}>
            {triggerLabel}
          </Text>
          {isOpen ? <ChevronUpIcon variant="muted" /> : <ChevronDownIcon variant="muted" />}
        </Flex>
      </button>

      {isOpen && (
        <Box
          style={{
            position: 'absolute',
            top: '40px',
            left: 0,
            right: 0,
            zIndex: 2,
            border: '1px solid #cfd9e5',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            boxShadow: '0 8px 24px rgba(20, 28, 41, 0.12)',
            padding: '4px 0',
            maxHeight: '280px',
            overflowY: 'auto',
          }}>
          <Box style={{ padding: '0 12px 4px' }}>
            <Box
              style={{
                position: 'relative',
                margin: '-4px -12px 0',
                padding: '12px 16px',
                borderBottom: '1px solid #edf2f7',
              }}>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search content types"
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  color: '#536171',
                  fontSize: '14px',
                  lineHeight: '20px',
                  fontWeight: 400,
                  paddingRight: '36px',
                  fontFamily: 'inherit',
                  height: '20px',
                }}
              />
              <Box
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '16px',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                <SearchIcon variant="muted" />
              </Box>
            </Box>
          </Box>

          {filteredContentTypes.length > 0 && (
            <Box
              style={{
                padding: '8px 16px',
              }}>
              <Checkbox
                isChecked={areAllFilteredSelected}
                onChange={toggleAllFiltered}
                style={{ fontWeight: 400 }}>
                <span style={{ fontWeight: 400 }}>Select all</span>
              </Checkbox>
            </Box>
          )}

          {filteredContentTypes.map((contentType) => (
            <Box
              key={contentType.id}
              style={{
                padding: '8px 16px',
              }}>
              <Checkbox
                isChecked={selectedContentTypeIds.includes(contentType.id)}
                onChange={() => toggleContentType(contentType.id)}
                style={{ fontWeight: 400 }}>
                <span style={{ fontWeight: 400 }}>{contentType.name}</span>
              </Checkbox>
            </Box>
          ))}

          {filteredContentTypes.length === 0 && (
            <Box style={{ padding: '12px' }}>
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
