import { useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { Box, Button, Modal, Flex, Text, TextInput } from '@contentful/f36-components';

import { type EditModalContent } from '@types';

import {
  modalContent,
  locationsContainer,
  selectedContentSection,
  selectedContentPreview,
  locationColumnLeft,
  locationColumnRight,
  locationColumnHeader,
  greyInfoCard,
  newLocationCard,
  newLocationScrollableList,
} from './EditModal.styles';
import { FieldSelectionDropdown } from './FieldSelectionDropdown';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewModel: EditModalContent;
  title: string;
  primaryButtonLabel: string;
  additionalContent?: ReactNode;
  onConfirmPrimary?: (selections: Record<string, string[]>) => void;
}

export const EditModal = ({
  isOpen,
  onClose,
  viewModel,
  title,
  primaryButtonLabel,
  additionalContent,
  onConfirmPrimary,
}: EditModalProps) => {
  const [selectedFieldIdsByEntry, setSelectedFieldIdsByEntry] = useState<Record<string, string[]>>(
    () => Object.fromEntries(viewModel.newLocations.map((loc) => [loc.id, loc.initialFieldIds]))
  );

  const [destinationFieldStateByEntry, setDestinationFieldStateByEntry] = useState<
    Record<string, { hasFieldOptions: boolean; hasSelectableOptions: boolean }>
  >({});

  const [entrySearch, setEntrySearch] = useState('');

  const newLocationIdsKey = viewModel.newLocations.map((loc) => loc.id).join('|');

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedFieldIdsByEntry(
      Object.fromEntries(viewModel.newLocations.map((loc) => [loc.id, loc.initialFieldIds]))
    );
    setDestinationFieldStateByEntry({});
    setEntrySearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from props only on open / location set change
  }, [isOpen, newLocationIdsKey]);

  const handleSelectedFieldIdsChangeForEntry = useCallback(
    (entryId: string) => (updater: (previous: string[]) => string[]) => {
      setSelectedFieldIdsByEntry((prev) => ({
        ...prev,
        [entryId]: updater(prev[entryId] ?? []),
      }));
    },
    []
  );

  const handleSelectableStateChangeForEntry = useCallback(
    (entryId: string) => (state: { hasFieldOptions: boolean; hasSelectableOptions: boolean }) => {
      setDestinationFieldStateByEntry((prev) => {
        const existing = prev[entryId];
        if (
          existing &&
          existing.hasFieldOptions === state.hasFieldOptions &&
          existing.hasSelectableOptions === state.hasSelectableOptions
        ) {
          return prev;
        }
        return { ...prev, [entryId]: state };
      });
    },
    []
  );

  const handlePrimaryAction = () => {
    onConfirmPrimary?.({ ...selectedFieldIdsByEntry });
  };

  const previewSectionTitle = viewModel.previewSectionTitle ?? 'Selected content';
  const previewText = (viewModel.contentPreview ?? viewModel.selectedText).trim();

  const filteredNewLocations = useMemo(() => {
    const query = entrySearch.trim().toLowerCase();
    if (!query) return viewModel.newLocations;
    return viewModel.newLocations.filter((loc) => loc.title.toLowerCase().includes(query));
  }, [viewModel.newLocations, entrySearch]);

  const isPrimaryDisabled = useMemo(() => {
    if (viewModel.newLocations.length === 0) return true;

    const allUnselectable = viewModel.newLocations.every((loc) => {
      const state = destinationFieldStateByEntry[loc.id];
      return loc.fieldOptions.length === 0 || state?.hasSelectableOptions === false;
    });
    if (allUnselectable) return true;

    const hasAnyChange = viewModel.newLocations.some((loc) => {
      const current = selectedFieldIdsByEntry[loc.id] ?? [];
      const initial = loc.initialFieldIds;
      return current.length !== initial.length || !current.every((id) => initial.includes(id));
    });

    return !hasAnyChange;
  }, [viewModel.newLocations, selectedFieldIdsByEntry, destinationFieldStateByEntry]);

  const firstCurrentLocation = viewModel.currentLocations[0];

  return (
    <Modal isShown={isOpen} onClose={onClose} size="large" shouldCloseOnOverlayClick={false}>
      {() => (
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content>
            <Box className={modalContent}>
              {/* Three sections in one bordered container */}
              <Box className={locationsContainer}>
                {/* Top: Selected content — spans full width */}
                <Box className={selectedContentSection}>
                  <Text as="p" fontWeight="fontWeightDemiBold">
                    {previewSectionTitle}
                  </Text>
                  <Box className={selectedContentPreview}>
                    {additionalContent ??
                      (viewModel.isImageContent ? (
                        <Text as="p">
                          <Text as="span">IMAGE: </Text>
                          {previewText}
                        </Text>
                      ) : (
                        <Text as="p">{previewText}</Text>
                      ))}
                  </Box>
                </Box>

                {/* Left: Current location */}
                <Box className={locationColumnLeft}>
                  <Box className={locationColumnHeader}>
                    <Text as="p" fontWeight="fontWeightDemiBold">
                      Current location
                    </Text>
                  </Box>
                  {firstCurrentLocation ? (
                    <Box className={greyInfoCard}>
                      <Box>
                        <Text as="p" fontColor="gray600" fontSize="fontSizeS">
                          Content type
                        </Text>
                        <Text as="p">{firstCurrentLocation.contentTypeName}</Text>
                      </Box>
                      <Box>
                        <Text as="p" fontColor="gray600" fontSize="fontSizeS">
                          Entry name
                        </Text>
                        <Text as="p">{firstCurrentLocation.entryName}</Text>
                      </Box>
                      <Box>
                        <Text as="p" fontColor="gray600" fontSize="fontSizeS">
                          Field
                        </Text>
                        <Text as="p">
                          {firstCurrentLocation.fieldName}{' '}
                          <Text as="span" fontColor="blue500">
                            | {firstCurrentLocation.fieldType}
                          </Text>
                        </Text>
                      </Box>
                    </Box>
                  ) : null}
                </Box>

                {/* Right: New location */}
                <Box className={locationColumnRight}>
                  <Box className={locationColumnHeader}>
                    <Text as="p" fontWeight="fontWeightDemiBold">
                      New location
                    </Text>
                    {/* + Add entry — no-op for now */}
                    <Button variant="transparent" size="small" startIcon={<span>+</span>}>
                      Add entry
                    </Button>
                  </Box>

                  <TextInput
                    placeholder="Search entries"
                    value={entrySearch}
                    onChange={(e) => setEntrySearch(e.target.value)}
                    aria-label="Search entries"
                  />

                  {/* Only this list scrolls */}
                  <Box className={newLocationScrollableList}>
                    {filteredNewLocations.map((loc) => {
                      const [contentTypePart, ...rest] = loc.title.split(': ');
                      const entryNamePart = rest.join(': ');
                      return (
                        <Box key={loc.id} className={newLocationCard}>
                          <Box>
                            <Text as="p" fontColor="gray600" fontSize="fontSizeS">
                              Content type
                            </Text>
                            <Text as="p">{contentTypePart}</Text>
                          </Box>
                          <Box>
                            <Text as="p" fontColor="gray600" fontSize="fontSizeS">
                              Entry name
                            </Text>
                            <Text as="p">{entryNamePart || loc.title}</Text>
                          </Box>
                          <FieldSelectionDropdown
                            isImageContent={viewModel.isImageContent}
                            selectedText={viewModel.selectedText}
                            fieldOptions={loc.fieldOptions}
                            fieldMappings={loc.fieldMappings}
                            selectedFieldIds={selectedFieldIdsByEntry[loc.id] ?? []}
                            onSelectedFieldIdsChange={handleSelectedFieldIdsChangeForEntry(loc.id)}
                            onSelectableStateChange={handleSelectableStateChangeForEntry(loc.id)}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={onClose} size="small" variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={handlePrimaryAction}
              size="small"
              variant="primary"
              isDisabled={isPrimaryDisabled}>
              {primaryButtonLabel}
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
