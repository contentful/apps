/**
 * EntrySelector Component
 *
 * Modal for selecting entries to use in reference field conditions
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Stack,
  Text,
  Box,
  Spinner,
  TextInput,
  FormControl,
  Checkbox,
} from '@contentful/f36-components';
import { SearchIcon } from '@contentful/f36-icons';
import { useCMA } from '@contentful/react-apps-toolkit';

interface EntrySelectorProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when entry is selected (single selection) */
  onSelect: (entryId: string, entryTitle: string) => void;
  /** Callback when multiple entries are selected (multiple selection) */
  onSelectMultiple?: (entries: Array<{ id: string; title: string }>) => void;
  /** Current space ID */
  spaceId: string;
  /** Current environment ID */
  environmentId: string;
  /** Optional content type ID to filter entries */
  contentTypeId?: string;
  /** Whether to allow multiple selection */
  allowMultiple?: boolean;
  /** Currently selected entry IDs to pre-select in the modal */
  initialSelectedIds?: string[];
}

interface EntryItem {
  id: string;
  title: string;
  contentType: string;
  updatedAt: string;
}

export const EntrySelector: React.FC<EntrySelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  onSelectMultiple,
  spaceId,
  environmentId,
  contentTypeId,
  allowMultiple = false,
  initialSelectedIds = [],
}) => {
  const cma = useCMA();
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<EntryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());

  // Initialize selected entry IDs when modal opens
  useEffect(() => {
    if (isOpen && allowMultiple && initialSelectedIds.length > 0) {
      setSelectedEntryIds(new Set(initialSelectedIds));
    } else if (isOpen && !allowMultiple) {
      // Clear selection for single select mode
      setSelectedEntryIds(new Set());
    }
  }, [isOpen, allowMultiple, initialSelectedIds]);

  // Load entries when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadEntries = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await cma.entry.getMany({
          spaceId,
          environmentId,
          query: {
            limit: 100,
            ...(contentTypeId && { content_type: contentTypeId }),
          },
        });

        const entryItems: EntryItem[] = response.items
          .filter((entry: any) => {
            // Filter out Conditionful Settings content type
            return entry.sys.contentType.sys.id !== 'conditionfulSettings';
          })
          .map((entry: any) => {
            // Try to get a meaningful title from the entry
            let title = 'Untitled Entry';
            if (entry.fields) {
              // Common title fields to check
              const titleFields = ['title', 'name', 'label', 'heading'];
              for (const fieldName of titleFields) {
                if (entry.fields[fieldName]) {
                  const fieldValue = entry.fields[fieldName];
                  // Get the first available locale value
                  const localeValue = Object.values(fieldValue)[0];
                  if (localeValue && typeof localeValue === 'string') {
                    title = localeValue;
                    break;
                  }
                }
              }
            }

            return {
              id: entry.sys.id,
              title,
              contentType: entry.sys.contentType.sys.id,
              updatedAt: entry.sys.updatedAt,
            };
          });

        setEntries(entryItems);
        setFilteredEntries(entryItems);
      } catch (err) {
        console.error('Error loading entries:', err);
        setError('Failed to load entries. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, [isOpen, cma, spaceId, environmentId, contentTypeId]);

  // Filter entries based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEntries(entries);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(query) ||
        entry.id.toLowerCase().includes(query) ||
        entry.contentType.toLowerCase().includes(query)
    );
    setFilteredEntries(filtered);
  }, [searchQuery, entries]);

  const handleSelect = (entry: EntryItem) => {
    if (allowMultiple) {
      // Toggle selection for multiple mode
      const newSelection = new Set(selectedEntryIds);
      if (newSelection.has(entry.id)) {
        newSelection.delete(entry.id);
      } else {
        newSelection.add(entry.id);
      }
      setSelectedEntryIds(newSelection);
    } else {
      // Single selection mode - select and close
      onSelect(entry.id, entry.title);
      setSearchQuery('');
      setSelectedEntryIds(new Set());
      onClose();
    }
  };

  const handleSaveMultiple = () => {
    if (onSelectMultiple && allowMultiple) {
      const selectedEntries = filteredEntries
        .filter((entry) => selectedEntryIds.has(entry.id))
        .map((entry) => ({ id: entry.id, title: entry.title }));

      // Also include entries from the full list if they're not in filtered
      const allSelectedEntries = entries
        .filter((entry) => selectedEntryIds.has(entry.id))
        .map((entry) => ({ id: entry.id, title: entry.title }));

      onSelectMultiple(allSelectedEntries);
      setSearchQuery('');
      setSelectedEntryIds(new Set());
      onClose();
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedEntryIds(new Set());
    onClose();
  };

  return (
    <Modal onClose={handleClose} isShown={isOpen} size="large">
      {() => (
        <>
          <Modal.Header
            title={allowMultiple ? 'Select Entries' : 'Select Entry'}
            onClose={handleClose}
          />
          <Modal.Content>
            <Stack flexDirection="column" spacing="spacingM">
              <FormControl>
                <FormControl.Label>Search entries</FormControl.Label>
                <TextInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, ID, or content type..."
                  icon={<SearchIcon />}
                />
              </FormControl>

              {isLoading ? (
                <Box padding="spacingL">
                  <Spinner size="large" />
                </Box>
              ) : error ? (
                <Text fontColor="red500">{error}</Text>
              ) : filteredEntries.length === 0 ? (
                <Text fontColor="gray500">
                  {searchQuery ? 'No entries match your search.' : 'No entries found.'}
                </Text>
              ) : (
                <Box
                  style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    border: '1px solid #d3dce0',
                    borderRadius: '6px',
                  }}>
                  <Stack flexDirection="column" spacing="none">
                    {filteredEntries.map((entry) => {
                      const isSelected = selectedEntryIds.has(entry.id);
                      return (
                        <Box
                          key={entry.id}
                          padding="spacingS"
                          style={{
                            borderBottom: '1px solid #e5ebed',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                            backgroundColor:
                              isSelected && allowMultiple ? '#e8f5fa' : 'transparent',
                          }}
                          onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                            if (!isSelected || !allowMultiple) {
                              e.currentTarget.style.backgroundColor = '#f7f9fa';
                            }
                          }}
                          onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                            e.currentTarget.style.backgroundColor =
                              isSelected && allowMultiple ? '#e8f5fa' : 'transparent';
                          }}
                          onClick={() => handleSelect(entry)}>
                          <Stack
                            flexDirection="row"
                            spacing="spacingS"
                            alignItems="center"
                            style={{ width: '100%' }}>
                            {allowMultiple && (
                              <Checkbox
                                id={`entry-${entry.id}`}
                                isChecked={isSelected}
                                onChange={() => handleSelect(entry)}
                              />
                            )}
                            <Stack flexDirection="column" spacing="spacing2Xs" style={{ flex: 1 }}>
                              <Text fontWeight="fontWeightDemiBold" fontSize="fontSizeM">
                                {entry.title}
                              </Text>
                              <Text fontSize="fontSizeS" fontColor="gray600">
                                ID: {entry.id} • Type: {entry.contentType}
                              </Text>
                            </Stack>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Modal.Content>
          <Modal.Controls>
            <>
              <Button variant="transparent" onClick={handleClose}>
                Cancel
              </Button>
              {allowMultiple && (
                <Button
                  variant="positive"
                  onClick={handleSaveMultiple}
                  isDisabled={selectedEntryIds.size === 0}>
                  Save Selection ({selectedEntryIds.size})
                </Button>
              )}
            </>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
