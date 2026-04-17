import { useCallback, useMemo, useRef, useState } from 'react';
import { Box, Button, Flex, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import type {
  ImageSourceRef,
  MappingReviewSuspendPayload,
  EditModalContent,
  EditLocationOption,
  SourceRef,
} from '@types';
import { FileTextIcon } from '@contentful/f36-icons';
import { useReviewTextSelection } from '@hooks/useReviewTextSelection';
import { getAnchorIdForSourceRef } from './resolveMappingCardOffsets';
import { type DocSegment, buildDocument } from './buildDocument';
import {
  buildMappingHighlightIndex,
  getMappingCardKey,
  type MappingHighlight,
  uniqueHighlights,
} from './buildHighlights';
import { buildListMarkers } from './buildListMarkers';
import { formatDisplayName, getFieldTypeLabel } from './fieldFormatting';
import { EditModal } from './edit-modals/EditModal';
import { mockExcludeSelection, mockNewLocationSelection } from './mockEditModalContent';

import { SelectionActionMenu } from './SelectionActionMenu';
import { buildSourceRefKey } from './sourceRefUtils';
import { MappingEntryCards, type AnchoredMappingCard } from './MappingEntryCards';
import { NormalizedDocumentSection } from './NormalizedDocumentSection';
import { useSegmentCardOffsets } from '@hooks/useSegmentCardOffsets';

const enableMockEditModal = import.meta.env.VITE_ENABLE_MOCK_EDIT_MODAL === 'true';

interface EditModalState {
  viewModel: EditModalContent;
  title: string;
  locationSectionDescription: string;
  primaryButtonLabel: string;
}

interface MappingViewProps {
  payload: MappingReviewSuspendPayload;
  selectedEntryIndex: number | null;
}

const EMPTY_EDIT_MODAL: EditModalState = {
  viewModel: {
    selectedText: '',
    currentLocations: [],
    isOpen: false,
  },
  title: '',
  locationSectionDescription: '',
  primaryButtonLabel: '',
};

function getEntryName(contentTypeName: string | undefined, entryIndex: number): string {
  const displayName = contentTypeName ?? 'Untitled';
  return `${displayName} #${entryIndex + 1}`;
}

/** `Range#intersectsNode` can throw when the range and node are in inconsistent trees. */
function rangeIntersectsNode(range: Range, node: Node): boolean {
  try {
    return range.intersectsNode(node);
  } catch {
    return false;
  }
}

export const MappingView = ({ payload, selectedEntryIndex }: MappingViewProps): JSX.Element => {
  const [hoveredMappingKeys, setHoveredMappingKeys] = useState<string[]>([]);
  const [editModalState, setEditModalState] = useState<EditModalState>(EMPTY_EDIT_MODAL);
  const textSelectionRootRef = useRef<HTMLDivElement | null>(null);

  const document = payload.normalizedDocument;
  const entryBlockGraph = payload.entryBlockGraph;
  const { selectionRectangle, selectedText, selectedRange, clearSelection } =
    useReviewTextSelection(textSelectionRootRef);

  const highlightIndex = useMemo(
    () => buildMappingHighlightIndex(entryBlockGraph),
    [entryBlockGraph]
  );

  const { tabs, allSegments } = useMemo(() => buildDocument(document), [document]);

  const imageById = useMemo(() => {
    const images = document.images ?? [];
    return images.reduce<Record<string, (typeof images)[number]>>((acc, image) => {
      acc[image.id] = image;
      return acc;
    }, {});
  }, [document.images]);

  const listMarkers = useMemo(() => buildListMarkers(allSegments), [allSegments]);

  const excludedSourceRefKeys = useMemo(
    () =>
      new Set(entryBlockGraph.excludedSourceRefs.map((sourceRef) => buildSourceRefKey(sourceRef))),
    [entryBlockGraph.excludedSourceRefs]
  );

  const getVisibleHighlights = useCallback(
    (highlights: MappingHighlight[]): MappingHighlight[] => {
      const filtered = highlights.filter(
        (highlight) => !excludedSourceRefKeys.has(buildSourceRefKey(highlight.sourceRef))
      );
      if (selectedEntryIndex === null) {
        return filtered;
      }
      return filtered.filter((item) => item.entryIndex === selectedEntryIndex);
    },
    [excludedSourceRefKeys, selectedEntryIndex]
  );

  const getHighlightsForSegment = useCallback(
    (segment: DocSegment): MappingHighlight[] => {
      if (segment.kind === 'table') {
        return uniqueHighlights(highlightIndex.tableHighlights[segment.id] ?? []);
      }
      return uniqueHighlights(highlightIndex.blockHighlights[segment.id] ?? []);
    },
    [highlightIndex.blockHighlights, highlightIndex.tableHighlights]
  );

  const buildLocationOption = useCallback(
    (
      entryIndex: number,
      fieldId: string,
      fieldType: string,
      sourceRef: SourceRef,
      isSelected = false
    ): EditLocationOption | null => {
      const graphEntry = entryBlockGraph.entries[entryIndex];
      if (!graphEntry) {
        return null;
      }
      const contentType = payload.contentTypes.find(
        (item) => item.sys.id === graphEntry.contentTypeId
      );
      const contentTypeDisplayName = (contentType?.name ?? '').trim();
      const contentTypeField = contentType?.fields.find((field) => field.id === fieldId);
      const fieldDisplayName = (contentTypeField?.name ?? '').trim();
      const fieldDisplayType = getFieldTypeLabel(fieldType);

      return {
        id: `${entryIndex}-${graphEntry.contentTypeId}-${fieldId}`,
        contentTypeId: graphEntry.contentTypeId,
        contentTypeName: contentTypeDisplayName,
        entryName: getEntryName(contentTypeDisplayName, entryIndex),
        fieldId,
        fieldName: fieldDisplayName,
        fieldType: fieldDisplayType,
        sourceRef,
        isSelected,
      };
    },
    [entryBlockGraph.entries, payload.contentTypes]
  );

  const locationsByMappingKey = useMemo<Map<string, EditLocationOption>>(() => {
    const byKey = new Map<string, EditLocationOption>();

    allSegments.forEach((segment) => {
      const highlights = getVisibleHighlights(getHighlightsForSegment(segment));
      highlights.forEach((highlight) => {
        const mappingKey = getMappingCardKey(segment.id, highlight);
        if (byKey.has(mappingKey)) {
          return;
        }
        const nextLocation = buildLocationOption(
          highlight.entryIndex,
          highlight.fieldId,
          highlight.fieldType,
          highlight.sourceRef,
          byKey.size === 0
        );
        if (nextLocation) {
          byKey.set(mappingKey, nextLocation);
        }
      });
    });

    return byKey;
  }, [allSegments, buildLocationOption, getHighlightsForSegment, getVisibleHighlights]);

  const getLocationsForSourceRef = (sourceRef: SourceRef): EditLocationOption[] => {
    const targetKey = buildSourceRefKey(sourceRef);
    const matches: EditLocationOption[] = [];

    entryBlockGraph.entries.forEach((entry, entryIndex) => {
      entry.fieldMappings.forEach((fieldMapping) => {
        const matchingSourceRef = fieldMapping.sourceRefs.find(
          (candidate) => buildSourceRefKey(candidate) === targetKey
        );
        if (!matchingSourceRef) {
          return;
        }

        const nextLocation = buildLocationOption(
          entryIndex,
          fieldMapping.fieldId,
          fieldMapping.fieldType,
          matchingSourceRef,
          matches.length === 0
        );
        if (nextLocation) {
          matches.push(nextLocation);
        }
      });
    });

    return matches;
  };

  const getLocationsForSelectedText = (): EditLocationOption[] => {
    const root = textSelectionRootRef.current;
    if (!root || !selectedRange) {
      return [];
    }

    const selectedMappedSegments = root.querySelectorAll<HTMLElement>(
      '[data-review-text-segment="true"][data-is-mapped="true"]'
    );
    const mappingKeys = new Set<string>();

    for (const segment of selectedMappedSegments) {
      if (!rangeIntersectsNode(selectedRange, segment)) {
        continue;
      }

      const serializedMappingKeys = segment.dataset.mappingKeys ?? '';
      serializedMappingKeys
        .split('|')
        .map((key) => key.trim())
        .filter(Boolean)
        .forEach((key) => mappingKeys.add(key));
    }

    const locations = Array.from(mappingKeys)
      .map((key) => locationsByMappingKey.get(key))
      .filter((location): location is EditLocationOption => Boolean(location));

    return locations.map((location, index) => ({
      ...location,
      isSelected: index === 0,
    }));
  };

  const mappingCardsBySegment = useMemo(
    () =>
      allSegments.reduce<Record<string, AnchoredMappingCard[]>>((acc, segment) => {
        acc[segment.id] = getVisibleHighlights(getHighlightsForSegment(segment)).map(
          (highlight) => ({
            key: getMappingCardKey(segment.id, highlight),
            fieldName: formatDisplayName(highlight.fieldId),
            fieldType: getFieldTypeLabel(highlight.fieldType),
            anchorId: getAnchorIdForSourceRef(highlight.sourceRef),
          })
        );
        return acc;
      }, {}),
    [allSegments, getHighlightsForSegment, getVisibleHighlights]
  );

  const { cardOffsetsBySegment, setSegmentLayoutRef, setCardWrapperRef } = useSegmentCardOffsets({
    allSegments,
    mappingCardsBySegment,
  });

  const openAssignModal = (preview: string, currentLocations: EditLocationOption[]) => {
    setEditModalState({
      viewModel: {
        selectedText: preview,
        currentLocations,
        isOpen: true,
      },
      title: 'Assign content',
      locationSectionDescription: '',
      primaryButtonLabel: 'Move content',
    });
  };

  const openExcludeModal = (preview: string, currentLocations: EditLocationOption[]) => {
    setEditModalState({
      viewModel: {
        selectedText: preview,
        currentLocations,
        isOpen: true,
      },
      title: 'Exclude content',
      locationSectionDescription:
        'This content is used in more than one place in the entry. Select which item to exclude.',
      primaryButtonLabel: 'Exclude content',
    });
  };

  const handleAssignFromSelection = () => {
    if (!selectedText.trim()) return;
    openAssignModal(selectedText.trim(), getLocationsForSelectedText());
    clearSelection();
  };

  const handleExcludeFromSelection = () => {
    if (!selectedText.trim()) return;
    openExcludeModal(selectedText.trim(), getLocationsForSelectedText());
    clearSelection();
  };

  const handleAssignImage = (sourceRef: ImageSourceRef, label: string) => {
    openAssignModal(label, getLocationsForSourceRef(sourceRef));
    setHoveredMappingKeys([]);
  };

  const handleExcludeImage = (sourceRef: ImageSourceRef, label: string) => {
    openExcludeModal(label, getLocationsForSourceRef(sourceRef));
    setHoveredMappingKeys([]);
  };

  const canExcludeSelectedText = useMemo(() => {
    const root = textSelectionRootRef.current;
    if (!root || !selectedRange) {
      return false;
    }

    const selectedSegments = root.querySelectorAll<HTMLElement>(
      '[data-review-text-segment="true"]'
    );

    return Array.from(selectedSegments).some(
      (segment) =>
        rangeIntersectsNode(selectedRange, segment) && segment.dataset.isMapped === 'true'
    );
  }, [selectedRange]);

  return (
    <>
      <Flex
        ref={textSelectionRootRef}
        flexDirection="column"
        gap="spacingS"
        style={{ padding: tokens.spacingM, marginTop: tokens.spacingM }}>
        {enableMockEditModal ? (
          <Flex justifyContent="flex-end" gap="spacingS">
            <Button
              variant="secondary"
              size="small"
              onClick={() =>
                setEditModalState({
                  viewModel: mockExcludeSelection,
                  title: 'Exclude content',
                  locationSectionDescription:
                    'This content is used in more than one place in the entry. Select which item to exclude.',
                  primaryButtonLabel: 'Exclude content',
                })
              }>
              Mock exclude modal
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() =>
                setEditModalState({
                  viewModel: mockNewLocationSelection,
                  title: 'Assign content',
                  locationSectionDescription: '',
                  primaryButtonLabel: 'Move content',
                })
              }>
              Mock new location modal
            </Button>
          </Flex>
        ) : null}

        {tabs.map((tab) => (
          <Box key={tab.id}>
            {tab.name && (
              <Flex alignItems="center" gap="spacingXs">
                <FileTextIcon />
                <Text fontWeight="fontWeightDemiBold">{tab.name}</Text>
              </Flex>
            )}

            <Flex flexDirection="column" gap="spacingS">
              {tab.segments.map((segment) => {
                const mappingCards = mappingCardsBySegment[segment.id] ?? [];

                return (
                  <Box key={segment.id}>
                    <Flex
                      gap="spacingM"
                      alignItems="stretch"
                      data-testid={`segment-layout-${segment.id}`}
                      ref={setSegmentLayoutRef(segment.id)}>
                      <NormalizedDocumentSection
                        segment={segment}
                        highlightIndex={highlightIndex}
                        imageById={imageById}
                        listMarkers={listMarkers}
                        excludedSourceRefs={entryBlockGraph.excludedSourceRefs}
                        selectedEntryIndex={selectedEntryIndex}
                        hoveredMappingKeys={hoveredMappingKeys}
                        onSetHoveredMappingKeys={setHoveredMappingKeys}
                        onAssignImage={handleAssignImage}
                        onExcludeImage={handleExcludeImage}
                      />

                      <MappingEntryCards
                        segmentId={segment.id}
                        mappingCards={mappingCards}
                        cardOffsetsBySegment={cardOffsetsBySegment}
                        hoveredMappingKeys={hoveredMappingKeys}
                        onSetHoveredMappingKeys={setHoveredMappingKeys}
                        setCardWrapperRef={setCardWrapperRef}
                      />
                    </Flex>
                  </Box>
                );
              })}
            </Flex>
          </Box>
        ))}
      </Flex>

      {selectionRectangle ? (
        <SelectionActionMenu
          anchorRectangle={selectionRectangle}
          onAssign={handleAssignFromSelection}
          onExclude={handleExcludeFromSelection}
          isMappedContent={canExcludeSelectedText}
        />
      ) : null}

      <EditModal
        isOpen={editModalState.viewModel.isOpen}
        onClose={() => setEditModalState(EMPTY_EDIT_MODAL)}
        viewModel={editModalState.viewModel}
        title={editModalState.title}
        locationSectionDescription={editModalState.locationSectionDescription}
        primaryButtonLabel={editModalState.primaryButtonLabel}
      />
    </>
  );
};
