import { useLayoutEffect, useMemo, useRef, useState, type RefCallback } from 'react';
import { Box, Button, Flex, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import type { ImageSourceRef, MappingReviewSuspendPayload, EditModalContent } from '@types';
import { FileTextIcon } from '@contentful/f36-icons';
import { useReviewTextSelection } from '@hooks/useReviewTextSelection';
import { getAnchorIdForSourceRef, resolveMarkerOffsets } from './resolveMappingCardOffsets';
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

export const MappingView = ({ payload, selectedEntryIndex }: MappingViewProps): JSX.Element => {
  const [hoveredMappingKeys, setHoveredMappingKeys] = useState<string[]>([]);
  const [cardOffsetsBySegment, setCardOffsetsBySegment] = useState<
    Record<string, Record<string, number>>
  >({});
  const [editModalState, setEditModalState] = useState<EditModalState>(EMPTY_EDIT_MODAL);
  const textSelectionRootRef = useRef<HTMLDivElement | null>(null);
  const segmentLayoutRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cardWrapperRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  const getVisibleHighlights = <T extends MappingHighlight>(highlights: T[]): T[] => {
    const filtered = highlights.filter(
      (highlight) =>
        !entryBlockGraph.excludedSourceRefs.some(
          (excluded) => buildSourceRefKey(excluded) === buildSourceRefKey(highlight.sourceRef)
        )
    );
    if (selectedEntryIndex === null) {
      return filtered;
    }
    return filtered.filter((item) => item.entryIndex === selectedEntryIndex);
  };

  const getHighlightsForSegment = (segment: DocSegment): MappingHighlight[] => {
    if (segment.kind === 'table') {
      return uniqueHighlights(highlightIndex.tableHighlights[segment.id] ?? []);
    }
    return uniqueHighlights(highlightIndex.blockHighlights[segment.id] ?? []);
  };

  const getMappingCardsForSegment = (segment: DocSegment): AnchoredMappingCard[] =>
    getVisibleHighlights(getHighlightsForSegment(segment)).map((highlight) => ({
      key: getMappingCardKey(segment.id, highlight),
      fieldName: formatDisplayName(highlight.fieldId),
      fieldType: getFieldTypeLabel(highlight.fieldType),
      anchorId: getAnchorIdForSourceRef(highlight.sourceRef),
    }));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mappingCardsBySegment = useMemo(
    () =>
      allSegments.reduce<Record<string, AnchoredMappingCard[]>>((acc, segment) => {
        acc[segment.id] = getMappingCardsForSegment(segment);
        return acc;
      }, {}),
    [allSegments, selectedEntryIndex, highlightIndex]
  );

  const setSegmentLayoutRef =
    (segmentId: string): RefCallback<HTMLDivElement> =>
    (node) => {
      segmentLayoutRefs.current[segmentId] = node;
    };

  const setCardWrapperRef =
    (cardKey: string): RefCallback<HTMLDivElement> =>
    (node) => {
      cardWrapperRefs.current[cardKey] = node;
    };

  useLayoutEffect(() => {
    const measureOffsets = () => {
      const nextOffsets: Record<string, Record<string, number>> = {};

      allSegments.forEach((segment) => {
        const segmentNode = segmentLayoutRefs.current[segment.id];
        const segmentCards = mappingCardsBySegment[segment.id] ?? [];

        if (!segmentNode || segmentCards.length === 0) {
          return;
        }

        const segmentTop = segmentNode.getBoundingClientRect().top;

        const cards = segmentCards.map((card) => {
          const anchorNode = segmentNode.querySelector<HTMLElement>(
            `#${CSS.escape(card.anchorId)}`
          );
          const wrapperNode = cardWrapperRefs.current[card.key];
          const rawTop = anchorNode
            ? Math.max(0, anchorNode.getBoundingClientRect().top - segmentTop)
            : 0;
          const height =
            wrapperNode?.getBoundingClientRect().height || wrapperNode?.offsetHeight || 28;

          return { key: card.key, rawTop, height };
        });

        nextOffsets[segment.id] = resolveMarkerOffsets(cards);
      });

      setCardOffsetsBySegment(nextOffsets);
    };

    measureOffsets();
  }, [mappingCardsBySegment, allSegments]);

  const openAssignModal = (preview: string) => {
    setEditModalState({
      viewModel: {
        selectedText: preview,
        currentLocations: [],
        isOpen: true,
      },
      title: 'Assign content',
      locationSectionDescription: '',
      primaryButtonLabel: 'Move content',
    });
  };

  const openExcludeModal = (preview: string) => {
    setEditModalState({
      viewModel: {
        selectedText: preview,
        currentLocations: [],
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
    openAssignModal(selectedText.trim());
    clearSelection();
  };

  const handleExcludeFromSelection = () => {
    if (!selectedText.trim()) return;
    openExcludeModal(selectedText.trim());
    clearSelection();
  };

  const handleAssignImage = (_sourceRef: ImageSourceRef, label: string) => {
    openAssignModal(label);
    setHoveredMappingKeys([]);
  };

  const handleExcludeImage = (_sourceRef: ImageSourceRef, label: string) => {
    openExcludeModal(label);
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

    return Array.from(selectedSegments).some((segment) => {
      try {
        if (!selectedRange.intersectsNode(segment)) {
          return false;
        }

        return segment.dataset.isMapped === 'true';
      } catch {
        return false;
      }
    });
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
