import { useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { Box, Button, Modal, Flex, Text } from '@contentful/f36-components';
import { type EditModalContent } from '@types';

import { modalContent, contentSection, sectionCard } from './EditModal.styles';
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
      setDestinationFieldStateByEntry((prev) => ({ ...prev, [entryId]: state }));
    },
    []
  );

  const handlePrimaryAction = () => {
    onConfirmPrimary?.({ ...selectedFieldIdsByEntry });
  };

  const previewSectionTitle = viewModel.previewSectionTitle ?? 'Content';
  const previewQuotedText = (viewModel.contentPreview ?? viewModel.selectedText).trim();

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

  return (
    <Modal isShown={isOpen} onClose={onClose} size="large" shouldCloseOnOverlayClick={false}>
      {() => (
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content>
            <Box className={`${modalContent}`}>
              <Box className={`${contentSection}`}>
                <Text as="p" fontWeight="fontWeightDemiBold">
                  {previewSectionTitle}
                </Text>
                <Box className={sectionCard}>
                  {additionalContent ??
                    (viewModel.isImageContent ? (
                      <Text as="p">
                        <Text as="span">IMAGE: </Text>
                        {previewQuotedText}
                      </Text>
                    ) : (
                      <Text as="p">&ldquo;{previewQuotedText}&rdquo;</Text>
                    ))}
                </Box>
              </Box>

              {viewModel.newLocations.length > 0 && (
                <Box>
                  <Text as="p" fontWeight="fontWeightMedium" marginBottom="spacingXs">
                    Assign to fields
                  </Text>
                  <Text as="p" fontColor="gray700" marginBottom="spacingM">
                    This app does not support edits for Reference, Boolean, Date &amp; time,
                    Location or JSON fields. Use the entry editor instead.
                  </Text>
                  <Flex flexDirection="column" gap="spacingXs">
                    {viewModel.newLocations.map((loc) => (
                      <Box key={loc.id} className={sectionCard}>
                        <Text as="p" marginBottom="spacingXs">
                          Select field(s) from the entry &ldquo;
                          <Text as="span" fontWeight="fontWeightDemiBold">
                            {loc.title}
                          </Text>
                          &rdquo;
                        </Text>
                        <Text
                          as="p"
                          fontWeight="fontWeightDemiBold"
                          marginTop="spacingM"
                          marginBottom="spacingXs">
                          Fields
                        </Text>
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
                    ))}
                  </Flex>
                </Box>
              )}
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
