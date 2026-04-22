import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefCallback } from 'react';
import { Box, Flex, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import {
  buildEntryListFromEntryBlockGraph,
  type EntryListRow,
} from '../../../../../utils/overviewEntryList';
import type {
  EntryBlockGraph,
  ImageSourceRef,
  MappingReviewSuspendPayload,
  EditModalContent,
  EditLocationOption,
  EditModalNewLocation,
  SourceRef,
} from '@types';
import { isTextSourceRef } from '@types';
import { FileTextIcon } from '@contentful/f36-icons';
import { useReviewTextSelection } from '@hooks/useReviewTextSelection';
import { getEntryTitleFromFieldMappings } from '../../../../../utils/getEntryTitle';
import { getAnchorIdForSourceRef, resolveMarkerOffsets } from './resolveMappingCardOffsets';
import { type DocSegment, buildDocument } from './buildDocument';
import {
  buildMappingHighlightIndex,
  getMappingCardKey,
  type MappingHighlight,
  uniqueHighlights,
} from './buildHighlights';
import { buildListMarkers } from './buildListMarkers';
import { displayType, formatDisplayName } from './fieldFormatting';
import { EditModal } from './edit-modals/EditModal';
import { isAssetFieldForImageAssign, isWorkflowContentTypeFieldWithId } from './fieldFormatting';

import { SelectionActionMenu } from './SelectionActionMenu';
import { buildSourceRefKey } from './sourceRefUtils';
import { MappingEntryCards, type AnchoredMappingCard } from './MappingEntryCards';
import { NormalizedDocumentSection } from './NormalizedDocumentSection';
import {
  applyImageExclusionToEntryBlockGraph,
  applyImageReassignToEntryBlockGraph,
  appendImageToTargets,
  applyTextAssignToEntryBlockGraph,
  applyTextExclusionToEntryBlockGraph,
  applyTextReassignToEntryBlockGraph,
  collectMappedExclusionPreviewText,
  collectTextAssignRangesFromSelection,
  collectTextExclusionRangesFromSelection,
  fullSpanTextExclusionRangesForSourceRef,
  type TextExclusionRange,
} from './entryBlockGraphExclusion';

type EditModalMode = 'exclude' | 'assign' | null;

interface EditModalState {
  mode: EditModalMode;
  viewModel: EditModalContent;
  title: string;
  locationSectionDescription: string;
  primaryButtonLabel: string;
}

interface MappingViewProps {
  payload: MappingReviewSuspendPayload;
  entryBlockGraph: EntryBlockGraph;
  onEntryBlockGraphChange: (next: EntryBlockGraph) => void;
  selectedEntryIndex: number | null;
  isDisabled?: boolean;
}

const EMPTY_NEW_LOCATION: EditModalNewLocation = {
  id: '',
  title: '',
  fieldOptions: [],
  fieldMappings: [],
};

const EMPTY_EDIT_MODAL: EditModalState = {
  mode: null,
  viewModel: {
    selectedText: '',
    currentLocations: [],
    newLocation: EMPTY_NEW_LOCATION,
    isOpen: false,
  },
  title: '',
  locationSectionDescription: '',
  primaryButtonLabel: '',
};

function findRowByEntryIndex(rows: EntryListRow[], index: number): EntryListRow | null {
  for (const row of rows) {
    if (row.entryIndex === index) return row;
    const found = findRowByEntryIndex(row.children, index);
    if (found) return found;
  }
  return null;
}

function getEntryName(contentTypeName: string | undefined, entryIndex: number): string {
  const displayName = contentTypeName ?? 'Untitled';
  return `${displayName} #${entryIndex + 1}`;
}

function getEntryReviewTitle(
  entry: MappingReviewSuspendPayload['entryBlockGraph']['entries'][number],
  displayField: string | undefined,
  fallbackEntryName: string
): string {
  const localizedFieldValue = displayField ? entry.fields?.[displayField] : undefined;
  if (localizedFieldValue) {
    const populatedValue = Object.values(localizedFieldValue).find(
      (candidate): candidate is string =>
        typeof candidate === 'string' && candidate.trim().length > 0
    );
    if (populatedValue) {
      return populatedValue.trim();
    }
  }

  const mappedTitle = getEntryTitleFromFieldMappings(entry, displayField).trim();
  return mappedTitle && mappedTitle !== 'Untitled' ? mappedTitle : fallbackEntryName;
}

/** `Range#intersectsNode` can throw when the range and node are in inconsistent trees. */
function rangeIntersectsNode(range: Range, node: Node): boolean {
  try {
    return range.intersectsNode(node);
  } catch {
    return false;
  }
}

export const MappingView = ({
  payload,
  entryBlockGraph,
  onEntryBlockGraphChange,
  selectedEntryIndex,
  isDisabled = false,
}: MappingViewProps): JSX.Element => {
  const selectedEntryRow = useMemo(() => {
    const rows = buildEntryListFromEntryBlockGraph(
      payload.entryBlockGraph.entries,
      payload.contentTypes,
      payload.referenceGraph.edges
    );
    return (
      (selectedEntryIndex !== null ? findRowByEntryIndex(rows, selectedEntryIndex) : null) ??
      rows[0] ??
      null
    );
  }, [
    payload.entryBlockGraph.entries,
    payload.contentTypes,
    payload.referenceGraph.edges,
    selectedEntryIndex,
  ]);
  const [hoveredMappingKeys, setHoveredMappingKeys] = useState<string[]>([]);
  const [cardOffsetsBySegment, setCardOffsetsBySegment] = useState<
    Record<string, Record<string, number>>
  >({});
  const [editModalState, setEditModalState] = useState<EditModalState>(EMPTY_EDIT_MODAL);
  const [pendingTextExclusionRanges, setPendingTextExclusionRanges] = useState<
    TextExclusionRange[] | null
  >(null);
  const [pendingImageSourceRef, setPendingImageSourceRef] = useState<ImageSourceRef | null>(null);
  const [pendingImageReassignSourceRef, setPendingImageReassignSourceRef] =
    useState<ImageSourceRef | null>(null);
  const [pendingTextReassignRanges, setPendingTextReassignRanges] = useState<TextExclusionRange[]>(
    []
  );
  const [pendingTextAssignRanges, setPendingTextAssignRanges] = useState<TextExclusionRange[]>([]);
  const textSelectionRootRef = useRef<HTMLDivElement | null>(null);
  const segmentLayoutRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cardWrapperRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const document = payload.normalizedDocument;

  const closeEditModal = () => {
    setEditModalState(EMPTY_EDIT_MODAL);
    setPendingTextExclusionRanges(null);
    setPendingImageSourceRef(null);
    setPendingImageReassignSourceRef(null);
    setPendingTextReassignRanges([]);
    setPendingTextAssignRanges([]);
  };

  const previousSelectedEntryIndexRef = useRef<number | null | undefined>(undefined);

  // Avoid confirming an exclude/assign that was opened under a different overview entry.
  useEffect(() => {
    if (previousSelectedEntryIndexRef.current === undefined) {
      previousSelectedEntryIndexRef.current = selectedEntryIndex;
      return;
    }
    if (previousSelectedEntryIndexRef.current !== selectedEntryIndex) {
      previousSelectedEntryIndexRef.current = selectedEntryIndex;
      closeEditModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to entry focus changes
  }, [selectedEntryIndex]);

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
    getVisibleHighlights(getHighlightsForSegment(segment)).map((highlight) => {
      const graphEntry = entryBlockGraph.entries[highlight.entryIndex];
      const contentType = payload.contentTypes.find(
        (item) => item.sys.id === graphEntry?.contentTypeId
      );
      const field = contentType?.fields.find((item) => item.id === highlight.fieldId);

      return {
        key: getMappingCardKey(segment.id, highlight),
        fieldName: formatDisplayName(highlight.fieldId),
        fieldType: field
          ? displayType(field.type ?? '', field.linkType, field.items)
          : displayType(highlight.fieldType),
        anchorId: getAnchorIdForSourceRef(highlight.sourceRef),
      };
    });

  const buildLocationOption = (
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
    const fieldDisplayType = contentTypeField
      ? displayType(contentTypeField.type ?? '', contentTypeField.linkType, contentTypeField.items)
      : displayType(fieldType);
    const entryName = getEntryTitleFromFieldMappings(graphEntry, contentType?.displayField);

    return {
      entryIndex,
      id: `${entryIndex}-${graphEntry.contentTypeId}-${fieldId}`,
      contentTypeId: graphEntry.contentTypeId,
      contentTypeName: contentTypeDisplayName,
      entryName,
      fieldId,
      fieldName: fieldDisplayName,
      fieldType: fieldDisplayType,
      sourceRef,
      isSelected,
    };
  };

  const locationsByMappingKey = useMemo(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSegments, entryBlockGraph, payload.contentTypes, selectedEntryIndex]);

  const getNewLocationForEntry = (
    entry: EntryBlockGraph['entries'][number],
    entryIndex: number
  ): EditModalNewLocation => {
    const contentType = payload.contentTypes.find((item) => item.sys.id === entry.contentTypeId);
    const contentTypeName = contentType?.name ?? entry.contentTypeId;
    const fallbackEntryName = getEntryName(contentTypeName, entryIndex);
    const entryTitle = getEntryReviewTitle(entry, contentType?.displayField, fallbackEntryName);
    const contentTypeFields = contentType?.fields ?? [];
    const fieldOptions = contentTypeFields
      .filter(isWorkflowContentTypeFieldWithId)
      .map((field) => ({
        id: field.id,
        fieldName: (field.name ?? '').trim() || formatDisplayName(field.id),
        fieldDisplayType: displayType(field.type ?? '', field.linkType, field.items),
        isAssetField: isAssetFieldForImageAssign(field),
      }));

    return {
      id: entry.tempId ?? `${entry.contentTypeId}-${entryIndex}`,
      title: `${contentTypeName}: ${entryTitle}`,
      fieldOptions,
      fieldMappings: entry.fieldMappings.map((fieldMapping) => ({
        fieldId: fieldMapping.fieldId,
      })),
    };
  };

  const newLocation = useMemo<EditModalNewLocation>(() => {
    if (selectedEntryIndex === null) {
      return EMPTY_NEW_LOCATION;
    }

    const selectedEntry = entryBlockGraph.entries[selectedEntryIndex];
    if (!selectedEntry) {
      return EMPTY_NEW_LOCATION;
    }

    return getNewLocationForEntry(selectedEntry, selectedEntryIndex);
  }, [entryBlockGraph.entries, payload.contentTypes, selectedEntryIndex]);

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

  const openAssignModal = (
    preview: string,
    currentLocations: EditLocationOption[],
    reassignRanges: TextExclusionRange[],
    assignRanges: TextExclusionRange[],
    imageSourceRef: ImageSourceRef | null = null
  ) => {
    setPendingTextExclusionRanges(null);
    setPendingImageSourceRef(null);
    setPendingImageReassignSourceRef(imageSourceRef);
    setPendingTextReassignRanges(reassignRanges);
    setPendingTextAssignRanges(assignRanges);
    setEditModalState({
      mode: 'assign',
      viewModel: {
        selectedText: preview,
        currentLocations,
        newLocation,
        isOpen: true,
      },
      title: 'Assign content',
      locationSectionDescription: '',
      primaryButtonLabel: 'Move content',
    });
  };

  const openExcludeModal = (
    selectedText: string,
    currentLocations: EditLocationOption[],
    preview?: { contentPreview: string; previewSectionTitle: string }
  ) => {
    setEditModalState({
      mode: 'exclude',
      viewModel: {
        selectedText,
        contentPreview: preview?.contentPreview,
        previewSectionTitle: preview?.previewSectionTitle,
        currentLocations,
        newLocation: EMPTY_NEW_LOCATION,
        isOpen: true,
      },
      title: 'Exclude content',
      locationSectionDescription:
        'This content is used in more than one place in the entry. Select which item to exclude.',
      primaryButtonLabel: 'Exclude content',
    });
  };

  const handleAssignFromSelection = () => {
    if (isDisabled || !selectedText.trim()) return;
    const reassignRanges = collectTextExclusionRangesFromSelection(
      textSelectionRootRef.current,
      selectedRange
    );
    const assignRanges = collectTextAssignRangesFromSelection(
      textSelectionRootRef.current,
      selectedRange
    );
    openAssignModal(
      selectedText.trim(),
      getLocationsForSelectedText(),
      reassignRanges,
      assignRanges
    );
    clearSelection();
  };

  const handleExcludeFromSelection = () => {
    if (isDisabled || !selectedText.trim()) return;
    const ranges = collectTextExclusionRangesFromSelection(
      textSelectionRootRef.current,
      selectedRange
    );
    setPendingTextExclusionRanges(ranges.length ? ranges : null);
    setPendingImageSourceRef(null);
    const trimmed = selectedText.trim();
    const mappedPreview = collectMappedExclusionPreviewText(
      textSelectionRootRef.current,
      selectedRange
    ).trim();
    openExcludeModal(trimmed, getLocationsForSelectedText(), {
      contentPreview: mappedPreview || trimmed,
      previewSectionTitle: 'Text to exclude',
    });
    clearSelection();
  };

  const handleAssignImage = (sourceRef: ImageSourceRef, label: string) => {
    if (isDisabled) return;
    openAssignModal(label, getLocationsForSourceRef(sourceRef), [], [], sourceRef);
    setHoveredMappingKeys([]);
  };

  const handleExcludeImage = (sourceRef: ImageSourceRef, label: string) => {
    if (isDisabled) return;
    setPendingImageSourceRef(sourceRef);
    setPendingTextExclusionRanges(null);
    openExcludeModal(label, getLocationsForSourceRef(sourceRef), {
      contentPreview: label,
      previewSectionTitle: 'Image to exclude',
    });
    setHoveredMappingKeys([]);
  };

  const handleEditModalConfirmPrimary = ({
    selectedLocationId,
    selectedFieldIds = {},
  }: {
    selectedLocationId: string | null;
    selectedFieldIds?: Record<string, string[]>;
  }) => {
    if (editModalState.mode === 'assign') {
      const locations = editModalState.viewModel.currentLocations;

      const newLocation = editModalState.viewModel.newLocation;
      const resolvedTargets: { entryIndex: number; fieldId: string; fieldType: string }[] = [];

      if (newLocation && selectedEntryIndex !== null) {
        const entry = entryBlockGraph.entries[selectedEntryIndex];
        const fieldIds = selectedFieldIds[newLocation.id] ?? [];
        const contentType = entry
          ? payload.contentTypes.find((c) => c.sys.id === entry.contentTypeId)
          : undefined;

        for (const fieldId of fieldIds) {
          const field = contentType?.fields?.find((f) => 'id' in f && f.id === fieldId);
          const fieldType =
            field && 'type' in field && typeof field.type === 'string' ? field.type : 'Text';
          if (!fieldId.length) {
            continue;
          }

          resolvedTargets.push({
            entryIndex: selectedEntryIndex,
            fieldId,
            fieldType,
          });
        }
      }

      if (!resolvedTargets.length) {
        return;
      }

      if (pendingImageReassignSourceRef) {
        if (locations.length === 0) {
          onEntryBlockGraphChange(
            appendImageToTargets(entryBlockGraph, pendingImageReassignSourceRef, resolvedTargets)
          );
          closeEditModal();
          return;
        }

        const from =
          locations.find((location) => location.id === selectedLocationId) ??
          locations.find((location) => location.isSelected) ??
          locations[0];

        if (!from) {
          closeEditModal();
          return;
        }

        onEntryBlockGraphChange(
          applyImageReassignToEntryBlockGraph(
            entryBlockGraph,
            from,
            pendingImageReassignSourceRef,
            resolvedTargets
          )
        );
        closeEditModal();
        return;
      }

      if (locations.length > 0) {
        const from =
          locations.find((location) => location.id === selectedLocationId) ??
          locations.find((location) => location.isSelected) ??
          locations[0];

        if (!from || !isTextSourceRef(from.sourceRef)) {
          closeEditModal();
          return;
        }

        const effectiveRanges = pendingTextReassignRanges.length
          ? pendingTextReassignRanges
          : fullSpanTextExclusionRangesForSourceRef(from.sourceRef);

        onEntryBlockGraphChange(
          applyTextReassignToEntryBlockGraph(
            entryBlockGraph,
            from,
            effectiveRanges,
            resolvedTargets
          )
        );
        closeEditModal();
        return;
      }

      if (!pendingTextAssignRanges.length) {
        closeEditModal();
        return;
      }

      onEntryBlockGraphChange(
        applyTextAssignToEntryBlockGraph(
          entryBlockGraph,
          document,
          pendingTextAssignRanges,
          resolvedTargets
        )
      );
      closeEditModal();
      return;
    }

    if (editModalState.mode !== 'exclude') {
      closeEditModal();
      return;
    }

    const locations = editModalState.viewModel.currentLocations;
    const selected =
      locations.find((location) => location.id === selectedLocationId) ??
      locations.find((location) => location.isSelected) ??
      locations[0];

    if (!selected) {
      closeEditModal();
      return;
    }

    if (pendingImageSourceRef) {
      onEntryBlockGraphChange(
        applyImageExclusionToEntryBlockGraph(entryBlockGraph, selected, pendingImageSourceRef)
      );
    } else if (pendingTextExclusionRanges?.length) {
      onEntryBlockGraphChange(
        applyTextExclusionToEntryBlockGraph(entryBlockGraph, selected, pendingTextExclusionRanges)
      );
    }

    closeEditModal();
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
        style={{ marginTop: tokens.spacingM }}>
        {selectedEntryRow && (
          <Box
            style={{
              borderBottom: `1px solid ${tokens.gray200}`,
              paddingBottom: tokens.spacingXs,
            }}>
            <Text
              as="p"
              fontSize="fontSizeS"
              fontWeight="fontWeightMedium"
              marginBottom="spacing2Xs">
              Currently viewing:
            </Text>
            <Text as="p" marginBottom="none">
              <Text as="span" fontWeight="fontWeightDemiBold">
                {selectedEntryRow.contentTypeName}
              </Text>
              {selectedEntryRow.entryTitle ? (
                <Text as="span" fontColor="gray600">
                  {' '}
                  ({selectedEntryRow.entryTitle})
                </Text>
              ) : null}
            </Text>
          </Box>
        )}
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

      {selectionRectangle && !isDisabled ? (
        <SelectionActionMenu
          anchorRectangle={selectionRectangle}
          onAssign={handleAssignFromSelection}
          onExclude={handleExcludeFromSelection}
          isMappedContent={canExcludeSelectedText}
        />
      ) : null}

      <EditModal
        isOpen={editModalState.viewModel.isOpen}
        onClose={closeEditModal}
        mode={editModalState.mode}
        viewModel={editModalState.viewModel}
        isImageContent={Boolean(pendingImageReassignSourceRef)}
        title={editModalState.title}
        locationSectionDescription={editModalState.locationSectionDescription}
        primaryButtonLabel={editModalState.primaryButtonLabel}
        onConfirmPrimary={handleEditModalConfirmPrimary}
      />
    </>
  );
};
