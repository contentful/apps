import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefCallback,
  type RefObject,
} from 'react';
import { Box, Flex, Note, Text } from '@contentful/f36-components';
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
  TableTextSourceRef,
} from '@types';
import {
  isBlockImageSourceRef,
  isTableImageSourceRef,
  isTableTextSourceRef,
  isTextSourceRef,
} from '@types';
import { FileTextIcon } from '@contentful/f36-icons';
import { useReviewTextSelection } from '@hooks/useReviewTextSelection';
import { getEntryTitleFromFieldMappings } from '../../../../../utils/getEntryTitle';
import { resolveMarkerOffsets } from './resolveMappingCardOffsets';
import { type DocSegment, buildDocument } from './buildDocument';
import {
  buildMappingHighlightIndex,
  getMappingCardKey,
  type MappingHighlight,
  uniqueHighlights,
} from './buildHighlights';
import { buildListMarkers } from './buildListMarkers';
import {
  displayType,
  isAssetFieldForImageAssign,
  isWorkflowContentTypeFieldWithId,
} from './fieldFormatting';
import { EditModal } from './edit-modals/EditModal';
import { RichTextSelectionPreview } from './edit-modals/RichTextSelectionPreview';

import { SelectionActionMenu } from './SelectionActionMenu';
import { buildSourceRefKey } from './sourceRefUtils';
import { MappingEntryCards } from './MappingEntryCards';
import { NormalizedDocumentSection } from './NormalizedDocumentSection';
import { buildMappingDisplayGroups } from './buildMappingDisplayGroups';
import {
  applyImageExclusionToEntryBlockGraph,
  applyImageReassignToEntryBlockGraph,
  appendImageToTargets,
  applyRichTextAssignToEntryBlockGraph,
  applyRichTextReassignToEntryBlockGraph,
  applyTextAssignToEntryBlockGraph,
  applyTextExclusionToEntryBlockGraph,
  applyTextReassignToEntryBlockGraph,
  collectRichTextSourceRefsFromSelection,
  collectMappedExclusionPreviewText,
  selectionIncludesTableContent,
  collectTextAssignRangesFromSelection,
  collectTextExclusionRangesFromSelection,
  fullSpanTextExclusionRangesForLocation,
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
  occludingTopRef?: RefObject<HTMLElement | null>;
  reviewMode?: 'single' | 'all';
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

function getPreferredAlignmentTop(anchorNode: HTMLElement | null, containerTop: number): number {
  if (!anchorNode) {
    return 0;
  }

  const alignmentTarget = anchorNode.querySelector<HTMLElement>(
    '[data-review-alignment-target="true"]'
  );
  const targetNode = alignmentTarget ?? anchorNode;
  return Math.max(0, targetNode.getBoundingClientRect().top - containerTop);
}

export const MappingView = ({
  payload,
  entryBlockGraph,
  onEntryBlockGraphChange,
  selectedEntryIndex,
  isDisabled = false,
  occludingTopRef,
  reviewMode = 'single',
}: MappingViewProps): JSX.Element => {
  const isReadOnlyAllMappings = reviewMode === 'all';
  const selectedEntryRow = useMemo(() => {
    if (isReadOnlyAllMappings) {
      return null;
    }
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
    isReadOnlyAllMappings,
  ]);
  const [hoveredMappingKeys, setHoveredMappingKeys] = useState<string[]>([]);
  const [cardOffsetsByGroup, setCardOffsetsByGroup] = useState<
    Record<string, Record<string, number>>
  >({});
  const [editModalState, setEditModalState] = useState<EditModalState>(EMPTY_EDIT_MODAL);
  const [pendingTextExclusionRanges, setPendingTextExclusionRanges] = useState<
    TextExclusionRange[] | null
  >(null);
  const [pendingImageSourceRef, setPendingImageSourceRef] = useState<ImageSourceRef | null>(null);
  const [pendingImageReassignSourceRef, setPendingImageReassignSourceRef] =
    useState<ImageSourceRef | null>(null);
  const [pendingExcludeImageSourceRefs, setPendingExcludeImageSourceRefs] = useState<
    ImageSourceRef[]
  >([]);
  const [pendingTextReassignRanges, setPendingTextReassignRanges] = useState<TextExclusionRange[]>(
    []
  );
  const [pendingTextAssignRanges, setPendingTextAssignRanges] = useState<TextExclusionRange[]>([]);
  const [pendingModalSelectionRange, setPendingModalSelectionRange] = useState<Range | null>(null);
  const [pendingPreviewSourceRefs, setPendingPreviewSourceRefs] = useState<SourceRef[]>([]);
  const [pendingPreviewHasTableContent, setPendingPreviewHasTableContent] = useState(false);
  const textSelectionRootRef = useRef<HTMLDivElement | null>(null);
  const groupLayoutRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cardWrapperRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const reviewAllContentRef = useRef<HTMLDivElement | null>(null);
  const document = payload.normalizedDocument;

  const closeEditModal = () => {
    setEditModalState(EMPTY_EDIT_MODAL);
    setPendingTextExclusionRanges(null);
    setPendingImageSourceRef(null);
    setPendingImageReassignSourceRef(null);
    setPendingExcludeImageSourceRefs([]);
    setPendingTextReassignRanges([]);
    setPendingTextAssignRanges([]);
    setPendingModalSelectionRange(null);
    setPendingPreviewSourceRefs([]);
    setPendingPreviewHasTableContent(false);
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
    useReviewTextSelection(textSelectionRootRef, occludingTopRef);

  const highlightIndex = useMemo(
    () => buildMappingHighlightIndex(entryBlockGraph, payload.contentTypes),
    [entryBlockGraph, payload.contentTypes]
  );

  const { tabs, allSegments } = useMemo(() => buildDocument(document), [document]);
  const reviewAllEntryCount = entryBlockGraph.entries.length;

  const imageById = useMemo(() => {
    const images = document.images ?? [];
    return images.reduce<Record<string, (typeof images)[number]>>((acc, image) => {
      acc[image.id] = image;
      return acc;
    }, {});
  }, [document.images]);

  const listMarkers = useMemo(() => buildListMarkers(allSegments), [allSegments]);

  const getVisibleHighlights = <T extends MappingHighlight>(highlights: T[]): T[] => {
    if (selectedEntryIndex === null) {
      return highlights;
    }
    return highlights.filter((item) => item.entryIndex === selectedEntryIndex);
  };

  const getHighlightsForSegment = (segment: DocSegment): MappingHighlight[] => {
    if (segment.kind === 'table') {
      return uniqueHighlights(highlightIndex.tableHighlights[segment.id] ?? []);
    }
    return uniqueHighlights(highlightIndex.blockHighlights[segment.id] ?? []);
  };

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

  const visibleHighlightsBySegment = useMemo(
    () =>
      allSegments.reduce<Record<string, MappingHighlight[]>>((acc, segment) => {
        acc[segment.id] = getVisibleHighlights(getHighlightsForSegment(segment));
        return acc;
      }, {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allSegments, entryBlockGraph, selectedEntryIndex]
  );

  const { groupsByTab, allGroups } = useMemo(
    () =>
      buildMappingDisplayGroups(
        tabs,
        visibleHighlightsBySegment,
        (highlight) => {
          const graphEntry = entryBlockGraph.entries[highlight.entryIndex];
          const contentType = payload.contentTypes.find(
            (item) => item.sys.id === graphEntry?.contentTypeId
          );
          const field = contentType?.fields.find((item) => item.id === highlight.fieldId);

          return field
            ? displayType(field.type ?? '', field.linkType, field.items)
            : displayType(highlight.fieldType);
        },
        (highlight) => {
          const graphEntry = entryBlockGraph.entries[highlight.entryIndex];
          const contentType = payload.contentTypes.find(
            (item) => item.sys.id === graphEntry?.contentTypeId
          );

          return contentType?.name ?? graphEntry?.contentTypeId ?? 'Entry';
        },
        (highlight) => {
          const graphEntry = entryBlockGraph.entries[highlight.entryIndex];
          const contentType = payload.contentTypes.find(
            (item) => item.sys.id === graphEntry?.contentTypeId
          );
          const fallbackEntryName = getEntryName(
            contentType?.name ?? graphEntry?.contentTypeId ?? 'Untitled',
            highlight.entryIndex
          );

          return graphEntry
            ? getEntryReviewTitle(graphEntry, contentType?.displayField, fallbackEntryName)
            : fallbackEntryName;
        }
      ),
    [tabs, visibleHighlightsBySegment, payload.contentTypes, entryBlockGraph.entries]
  );

  const locationsByMappingKey = useMemo(() => {
    const byKey = new Map<string, EditLocationOption>();

    allSegments.forEach((segment) => {
      const highlights = visibleHighlightsBySegment[segment.id] ?? [];
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
  }, [allSegments, entryBlockGraph, payload.contentTypes, visibleHighlightsBySegment]);

  const locationsByCardKey = useMemo(() => {
    const byKey = new Map<string, EditLocationOption>();

    allGroups.forEach((group) => {
      group.mappingCards.forEach((card) => {
        const sourceLocationByKey = new Map<string, EditLocationOption>();

        card.mappingKeys.forEach((mappingKey) => {
          const location = locationsByMappingKey.get(mappingKey);
          if (!location) {
            return;
          }

          sourceLocationByKey.set(buildSourceRefKey(location.sourceRef), location);
        });

        const sourceLocations = Array.from(sourceLocationByKey.values());
        const firstLocation = sourceLocations[0];
        if (!firstLocation) {
          return;
        }

        byKey.set(card.key, {
          ...firstLocation,
          id: card.key,
          sourceRefs: sourceLocations.map((location) => location.sourceRef),
          mappingKeys: [...card.mappingKeys],
          isSelected: false,
        });
      });
    });

    return byKey;
  }, [allGroups, locationsByMappingKey]);

  const getNewLocationForEntry = (
    entry: EntryBlockGraph['entries'][number],
    entryIndex: number
  ): EditModalNewLocation => {
    const contentType = payload.contentTypes.find((item) => item.sys.id === entry.contentTypeId);
    const contentTypeName = contentType?.name ?? entry.contentTypeId;
    const fallbackEntryName = getEntryName(contentTypeName, entryIndex);
    const entryTitle = getEntryReviewTitle(entry, contentType?.displayField, fallbackEntryName);
    const contentTypeFields = contentType?.fields ?? [];
    const fieldOptions = contentTypeFields.filter(isWorkflowContentTypeFieldWithId).map((field) => {
      const fieldType = typeof field.type === 'string' ? field.type : 'Text';

      return {
        id: field.id,
        fieldName: (field.name ?? '').trim() || field.id,
        fieldType,
        fieldDisplayType: displayType(fieldType, field.linkType, field.items),
        isAssetField: isAssetFieldForImageAssign(field),
      };
    });

    return {
      id: entry.tempId ?? `${entry.contentTypeId}-${entryIndex}`,
      title: `${contentTypeName}: ${entryTitle}`,
      fieldOptions,
      fieldMappings: entry.fieldMappings.map((fieldMapping) => ({
        fieldId: fieldMapping.fieldId,
        sourceRefs: fieldMapping.sourceRefs,
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

    const locations = allGroups
      .flatMap((group) => group.mappingCards)
      .filter((card) => card.mappingKeys.some((key) => mappingKeys.has(key)))
      .map((card) => locationsByCardKey.get(card.key))
      .filter((location): location is EditLocationOption => Boolean(location));

    return locations.map((location) => ({
      ...location,
      isSelected: false,
    }));
  };

  const setGroupLayoutRef =
    (groupId: string): RefCallback<HTMLDivElement> =>
    (node) => {
      groupLayoutRefs.current[groupId] = node;
    };

  const setCardWrapperRef =
    (cardKey: string): RefCallback<HTMLDivElement> =>
    (node) => {
      cardWrapperRefs.current[cardKey] = node;
    };

  useLayoutEffect(() => {
    const measureOffsets = () => {
      const nextOffsets: Record<string, Record<string, number>> = {};

      allGroups.forEach((group) => {
        const groupNode = groupLayoutRefs.current[group.id];
        const groupCards = group.mappingCards;

        if (!groupNode || groupCards.length === 0) {
          return;
        }

        const groupTop = groupNode.getBoundingClientRect().top;

        const cards = groupCards.map((card) => {
          const anchorNode = groupNode.querySelector<HTMLElement>(`#${CSS.escape(card.anchorId)}`);
          const wrapperNode = cardWrapperRefs.current[card.key];
          const rawTop = getPreferredAlignmentTop(anchorNode, groupTop);
          const height =
            wrapperNode?.getBoundingClientRect().height || wrapperNode?.offsetHeight || 28;

          return { key: card.key, rawTop, height };
        });

        nextOffsets[group.id] = resolveMarkerOffsets(cards);
      });

      if (isReadOnlyAllMappings) {
        const reviewAllNode = reviewAllContentRef.current;
        const reviewAllCards = tabs.flatMap((tab) =>
          (groupsByTab[tab.id] ?? []).flatMap((group) => group.mappingCards)
        );

        if (reviewAllNode && reviewAllCards.length > 0) {
          const reviewAllTop = reviewAllNode.getBoundingClientRect().top;
          const cards = reviewAllCards.map((card) => {
            const anchorNode = reviewAllNode.querySelector<HTMLElement>(
              `#${CSS.escape(card.anchorId)}`
            );
            const wrapperNode = cardWrapperRefs.current[card.key];
            const rawTop = getPreferredAlignmentTop(anchorNode, reviewAllTop);
            const height =
              wrapperNode?.getBoundingClientRect().height || wrapperNode?.offsetHeight || 28;

            return { key: card.key, rawTop, height };
          });

          nextOffsets['review-all'] = resolveMarkerOffsets(cards, { gap: 8 });
        }
      }
      setCardOffsetsByGroup(nextOffsets);
    };

    measureOffsets();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      measureOffsets();
    });

    allGroups.forEach((group) => {
      const groupNode = groupLayoutRefs.current[group.id];
      if (groupNode) {
        observer.observe(groupNode);
      }

      group.mappingCards.forEach((card) => {
        const wrapperNode = cardWrapperRefs.current[card.key];
        if (wrapperNode) {
          observer.observe(wrapperNode);
        }
      });
    });

    if (isReadOnlyAllMappings && reviewAllContentRef.current) {
      observer.observe(reviewAllContentRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [allGroups, groupsByTab, isReadOnlyAllMappings, tabs]);

  const openAssignModal = (
    preview: string,
    currentLocations: EditLocationOption[],
    reassignRanges: TextExclusionRange[],
    assignRanges: TextExclusionRange[],
    imageSourceRef: ImageSourceRef | null = null,
    selectionRange: Range | null = null,
    previewSourceRefs: SourceRef[] = []
  ) => {
    setPendingTextExclusionRanges(null);
    setPendingImageSourceRef(null);
    setPendingImageReassignSourceRef(imageSourceRef);
    setPendingTextReassignRanges(reassignRanges);
    setPendingTextAssignRanges(assignRanges);
    setPendingModalSelectionRange(selectionRange ? selectionRange.cloneRange() : null);
    setPendingPreviewSourceRefs(previewSourceRefs);
    setPendingPreviewHasTableContent(
      selectionRange
        ? selectionIncludesTableContent(textSelectionRootRef.current, selectionRange)
        : false
    );
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
    preview?: { contentPreview: string; previewSectionTitle: string },
    selectionRange: Range | null = null,
    previewSourceRefs: SourceRef[] = []
  ) => {
    setPendingExcludeImageSourceRefs(
      previewSourceRefs.filter(
        (sourceRef): sourceRef is ImageSourceRef =>
          isBlockImageSourceRef(sourceRef) || isTableImageSourceRef(sourceRef)
      )
    );
    setPendingModalSelectionRange(selectionRange ? selectionRange.cloneRange() : null);
    setPendingPreviewSourceRefs(previewSourceRefs);
    setPendingPreviewHasTableContent(
      selectionRange
        ? selectionIncludesTableContent(textSelectionRootRef.current, selectionRange)
        : false
    );
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
        currentLocations.length > 1
          ? 'This content is used in more than one place in the entry. Select which item to exclude.'
          : '',
      primaryButtonLabel: 'Exclude content',
    });
  };

  const handleAssignFromSelection = () => {
    if (isDisabled || isReadOnlyAllMappings || !selectedText.trim()) return;
    const selectionRange = selectedRange ? selectedRange.cloneRange() : null;
    const reassignRanges = collectTextExclusionRangesFromSelection(
      textSelectionRootRef.current,
      selectionRange
    );
    const assignRanges = collectTextAssignRangesFromSelection(
      textSelectionRootRef.current,
      selectionRange
    );
    const previewSourceRefs = collectRichTextSourceRefsFromSelection(
      textSelectionRootRef.current,
      selectionRange,
      document
    );
    openAssignModal(
      selectedText.trim(),
      getLocationsForSelectedText(),
      reassignRanges,
      assignRanges,
      null,
      selectionRange,
      previewSourceRefs
    );
    clearSelection();
  };

  const handleExcludeFromSelection = () => {
    if (isDisabled || isReadOnlyAllMappings || !selectedText.trim()) return;
    const selectionRange = selectedRange ? selectedRange.cloneRange() : null;
    const ranges = collectTextExclusionRangesFromSelection(
      textSelectionRootRef.current,
      selectionRange
    );
    setPendingTextExclusionRanges(ranges.length ? ranges : null);
    setPendingImageSourceRef(null);
    const trimmed = selectedText.trim();
    const mappedPreview = collectMappedExclusionPreviewText(
      textSelectionRootRef.current,
      selectionRange
    ).trim();
    const previewSourceRefs = collectRichTextSourceRefsFromSelection(
      textSelectionRootRef.current,
      selectionRange,
      document,
      { mappedState: 'mapped' }
    );
    openExcludeModal(
      trimmed,
      getLocationsForSelectedText(),
      {
        contentPreview: mappedPreview || trimmed,
        previewSectionTitle: 'Selected content',
      },
      selectionRange,
      previewSourceRefs
    );
    clearSelection();
  };

  const handleAssignImage = (sourceRef: ImageSourceRef, label: string) => {
    if (isDisabled || isReadOnlyAllMappings) return;
    openAssignModal(label, getLocationsForSourceRef(sourceRef), [], [], sourceRef);
    setHoveredMappingKeys([]);
  };

  const handleExcludeImage = (sourceRef: ImageSourceRef, label: string) => {
    if (isDisabled || isReadOnlyAllMappings) return;
    setPendingImageSourceRef(sourceRef);
    setPendingTextExclusionRanges(null);
    openExcludeModal(label, getLocationsForSourceRef(sourceRef), {
      contentPreview: label,
      previewSectionTitle: 'Image to exclude',
    });
    setHoveredMappingKeys([]);
  };

  const handleEditModalConfirmPrimary = ({
    selectedLocationIds = [],
    selectedFieldIds = {},
  }: {
    selectedLocationIds?: string[];
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

      const richTextTargets = resolvedTargets.filter((target) => target.fieldType === 'RichText');
      const nonRichTextTargets = resolvedTargets.filter(
        (target) => target.fieldType !== 'RichText'
      );

      if (pendingImageReassignSourceRef) {
        if (locations.length === 0) {
          onEntryBlockGraphChange(
            appendImageToTargets(entryBlockGraph, pendingImageReassignSourceRef, resolvedTargets)
          );
          closeEditModal();
          return;
        }

        const from =
          locations.find((location) => location.id === selectedLocationIds[0]) ??
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
          locations.find((location) => location.id === selectedLocationIds[0]) ??
          locations.find((location) => location.isSelected) ??
          locations[0];

        if (!from) {
          closeEditModal();
          return;
        }

        let nextGraph = entryBlockGraph;

        if (richTextTargets.length && pendingModalSelectionRange) {
          const mappedRichTextRefs = collectRichTextSourceRefsFromSelection(
            textSelectionRootRef.current,
            pendingModalSelectionRange,
            document,
            {
              mappedState: 'mapped',
              mappingKeys: new Set(from.mappingKeys ?? []),
            }
          );
          const unmappedRichTextRefs = collectRichTextSourceRefsFromSelection(
            textSelectionRootRef.current,
            pendingModalSelectionRange,
            document,
            { mappedState: 'unmapped' }
          );
          const richTextRefs = [...mappedRichTextRefs, ...unmappedRichTextRefs];

          if (richTextRefs.length) {
            nextGraph = applyRichTextReassignToEntryBlockGraph(
              nextGraph,
              document,
              from,
              richTextRefs,
              richTextTargets
            );
          }
        }

        if (!nonRichTextTargets.length) {
          onEntryBlockGraphChange(nextGraph);
          closeEditModal();
          return;
        }

        const effectiveRanges = pendingTextReassignRanges.length
          ? pendingTextReassignRanges
          : fullSpanTextExclusionRangesForLocation(from);

        if (!effectiveRanges.length) {
          onEntryBlockGraphChange(nextGraph);
          closeEditModal();
          return;
        }

        onEntryBlockGraphChange(
          applyTextReassignToEntryBlockGraph(nextGraph, from, effectiveRanges, nonRichTextTargets)
        );
        closeEditModal();
        return;
      }

      let nextGraph = entryBlockGraph;

      if (richTextTargets.length && pendingModalSelectionRange) {
        const richTextRefs = collectRichTextSourceRefsFromSelection(
          textSelectionRootRef.current,
          pendingModalSelectionRange,
          document,
          { mappedState: 'unmapped' }
        );

        if (richTextRefs.length) {
          nextGraph = applyRichTextAssignToEntryBlockGraph(
            nextGraph,
            document,
            richTextRefs,
            richTextTargets
          );
        }
      }

      if (!nonRichTextTargets.length) {
        onEntryBlockGraphChange(nextGraph);
        closeEditModal();
        return;
      }

      if (!pendingTextAssignRanges.length) {
        onEntryBlockGraphChange(nextGraph);
        closeEditModal();
        return;
      }

      onEntryBlockGraphChange(
        applyTextAssignToEntryBlockGraph(
          nextGraph,
          document,
          pendingTextAssignRanges,
          nonRichTextTargets
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
    const selected = locations.filter((location) => selectedLocationIds.includes(location.id));

    if (!selected.length) {
      closeEditModal();
      return;
    }

    let next = entryBlockGraph;
    for (const location of selected) {
      if (pendingImageSourceRef) {
        next = applyImageExclusionToEntryBlockGraph(next, location, pendingImageSourceRef);
      } else {
        const selectedSourceRefKeys = new Set(
          (location.sourceRefs?.length ? location.sourceRefs : [location.sourceRef]).map(
            (sourceRef) => buildSourceRefKey(sourceRef)
          )
        );
        const matchingImageSourceRefs = pendingExcludeImageSourceRefs.filter((sourceRef) =>
          selectedSourceRefKeys.has(buildSourceRefKey(sourceRef))
        );

        if (pendingTextExclusionRanges?.length) {
          next = applyTextExclusionToEntryBlockGraph(next, location, pendingTextExclusionRanges);
        }

        if (matchingImageSourceRefs.length) {
          next = matchingImageSourceRefs.reduce(
            (graph, sourceRef) => applyImageExclusionToEntryBlockGraph(graph, location, sourceRef),
            next
          );
        }
      }
    }

    if (next !== entryBlockGraph) {
      onEntryBlockGraphChange(next);
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
        {(selectedEntryRow || isReadOnlyAllMappings) && (
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
            <Text as="div" marginBottom="none">
              {isReadOnlyAllMappings ? (
                <>
                  <Text as="span" fontWeight="fontWeightDemiBold">
                    {`All entries (${reviewAllEntryCount})`}
                  </Text>
                </>
              ) : (
                <>
                  <Text as="span" fontWeight="fontWeightDemiBold">
                    {selectedEntryRow?.contentTypeName}
                  </Text>
                  {selectedEntryRow?.entryTitle ? (
                    <Text as="span" fontColor="gray600">
                      {' '}
                      ({selectedEntryRow.entryTitle})
                    </Text>
                  ) : null}
                </>
              )}
            </Text>
          </Box>
        )}
        {isReadOnlyAllMappings ? (
          <Flex gap="spacingM" alignItems="flex-start">
            <Box ref={reviewAllContentRef} style={{ flex: 1, minWidth: 0 }}>
              {tabs.map((tab) => {
                const tabGroups = groupsByTab[tab.id] ?? [];

                const renderReviewAllGroup = (group: (typeof tabGroups)[number]) => {
                  const isGroupHovered = group.mappingCards.some((card) =>
                    card.mappingKeys.some((key) => hoveredMappingKeys.includes(key))
                  );
                  const prefersImageOnlyHighlight =
                    group.mappingCards.length === 1 &&
                    group.hasImageSourceRefs &&
                    !group.hasTextSourceRefs;
                  const showGroupedSurface = group.showGroupedSurface && !prefersImageOnlyHighlight;

                  return (
                    <Box key={group.id}>
                      {showGroupedSurface ? (
                        <Box
                          data-testid={`mapping-group-surface-${group.id}`}
                          data-hovered={isGroupHovered ? 'true' : 'false'}
                          style={{
                            border: `1px solid ${
                              isGroupHovered ? tokens.green600 : tokens.green500
                            }`,
                            borderRadius: tokens.borderRadiusMedium,
                            backgroundColor: 'transparent',
                            padding: tokens.spacing2Xs,
                            boxShadow: isGroupHovered
                              ? `inset 0 0 0 1px ${tokens.green600}`
                              : undefined,
                            transition: 'border-color 120ms ease, box-shadow 120ms ease',
                          }}>
                          <Flex flexDirection="column" gap="spacing2Xs">
                            {group.segments.map((segment) => (
                              <NormalizedDocumentSection
                                key={segment.id}
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
                                readOnly
                                showReadOnlyOutline={
                                  !showGroupedSurface && !prefersImageOnlyHighlight
                                }
                                preferImageReadOnlyHighlight={prefersImageOnlyHighlight}
                                suppressInlineHighlights={showGroupedSurface}
                              />
                            ))}
                          </Flex>
                        </Box>
                      ) : (
                        <Flex flexDirection="column" gap="spacingS">
                          {group.segments.map((segment) => (
                            <NormalizedDocumentSection
                              key={segment.id}
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
                              readOnly
                              showReadOnlyOutline={
                                !showGroupedSurface && !prefersImageOnlyHighlight
                              }
                              preferImageReadOnlyHighlight={prefersImageOnlyHighlight}
                              suppressInlineHighlights={showGroupedSurface}
                            />
                          ))}
                        </Flex>
                      )}
                    </Box>
                  );
                };

                return (
                  <Box key={tab.id}>
                    {tab.name && (
                      <Flex alignItems="center" gap="spacingXs">
                        <FileTextIcon />
                        <Text fontWeight="fontWeightDemiBold">{tab.name}</Text>
                      </Flex>
                    )}

                    <Flex flexDirection="column" gap="spacingS">
                      {tabGroups.map(renderReviewAllGroup)}
                    </Flex>
                  </Box>
                );
              })}
            </Box>
            <Box
              style={{
                flex: '0 0 320px',
                width: 320,
                paddingRight: tokens.spacing2Xs,
                alignSelf: 'flex-start',
              }}>
              <MappingEntryCards
                groupId="review-all"
                mappingCards={tabs.flatMap((tab) =>
                  (groupsByTab[tab.id] ?? []).flatMap((group) => group.mappingCards)
                )}
                cardOffsetsByGroup={cardOffsetsByGroup}
                hoveredMappingKeys={hoveredMappingKeys}
                onSetHoveredMappingKeys={setHoveredMappingKeys}
                setCardWrapperRef={setCardWrapperRef}
                showContentTypeName
                useStaticLayout={false}
              />
            </Box>
          </Flex>
        ) : (
          tabs.map((tab) => {
            const tabGroups = groupsByTab[tab.id] ?? [];
            const renderGroup = (group: (typeof tabGroups)[number]) => {
              const isGroupHovered = group.mappingCards.some((card) =>
                card.mappingKeys.some((key) => hoveredMappingKeys.includes(key))
              );
              const prefersImageOnlyHighlight =
                group.mappingCards.length === 1 &&
                group.hasImageSourceRefs &&
                !group.hasTextSourceRefs;
              const showGroupedSurface = group.showGroupedSurface && !prefersImageOnlyHighlight;

              return (
                <Box key={group.id}>
                  <Flex
                    gap="spacingM"
                    alignItems="stretch"
                    data-testid={`display-group-layout-${group.id}`}
                    ref={setGroupLayoutRef(group.id)}>
                    <Box style={{ flex: 1 }}>
                      {showGroupedSurface ? (
                        <Box
                          data-testid={`mapping-group-surface-${group.id}`}
                          data-hovered={isGroupHovered ? 'true' : 'false'}
                          style={{
                            border: `1px solid ${
                              isGroupHovered ? tokens.green600 : tokens.green500
                            }`,
                            borderRadius: tokens.borderRadiusMedium,
                            backgroundColor: isReadOnlyAllMappings
                              ? 'transparent'
                              : tokens.green100,
                            padding: tokens.spacing2Xs,
                            boxShadow: isGroupHovered
                              ? `inset 0 0 0 1px ${tokens.green600}`
                              : undefined,
                            transition: 'border-color 120ms ease, box-shadow 120ms ease',
                          }}>
                          <Flex flexDirection="column" gap="spacing2Xs">
                            {group.segments.map((segment) => (
                              <NormalizedDocumentSection
                                key={segment.id}
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
                                readOnly={isReadOnlyAllMappings}
                                showReadOnlyOutline={
                                  !showGroupedSurface && !prefersImageOnlyHighlight
                                }
                                preferImageReadOnlyHighlight={prefersImageOnlyHighlight}
                                suppressInlineHighlights={showGroupedSurface}
                              />
                            ))}
                          </Flex>
                        </Box>
                      ) : (
                        <Flex flexDirection="column" gap="spacingS">
                          {group.segments.map((segment) => (
                            <NormalizedDocumentSection
                              key={segment.id}
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
                              readOnly={isReadOnlyAllMappings}
                              showReadOnlyOutline={
                                !showGroupedSurface && !prefersImageOnlyHighlight
                              }
                              preferImageReadOnlyHighlight={prefersImageOnlyHighlight}
                              suppressInlineHighlights={showGroupedSurface}
                            />
                          ))}
                        </Flex>
                      )}
                    </Box>

                    {!isReadOnlyAllMappings ? (
                      <MappingEntryCards
                        groupId={group.id}
                        mappingCards={group.mappingCards}
                        cardOffsetsByGroup={cardOffsetsByGroup}
                        hoveredMappingKeys={hoveredMappingKeys}
                        onSetHoveredMappingKeys={setHoveredMappingKeys}
                        setCardWrapperRef={setCardWrapperRef}
                        showContentTypeName={false}
                      />
                    ) : null}
                  </Flex>
                </Box>
              );
            };

            return (
              <Box key={tab.id}>
                {tab.name && (
                  <Flex alignItems="center" gap="spacingXs">
                    <FileTextIcon />
                    <Text fontWeight="fontWeightDemiBold">{tab.name}</Text>
                  </Flex>
                )}

                <Flex flexDirection="column" gap="spacingS">
                  {tabGroups.map(renderGroup)}
                </Flex>
              </Box>
            );
          })
        )}
      </Flex>

      {selectionRectangle && !isDisabled && !isReadOnlyAllMappings ? (
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
        isImageContent={Boolean(pendingImageReassignSourceRef) || Boolean(pendingImageSourceRef)}
        title={editModalState.title}
        locationSectionDescription={editModalState.locationSectionDescription}
        primaryButtonLabel={editModalState.primaryButtonLabel}
        additionalContent={(() => {
          if (!pendingPreviewSourceRefs.length && !pendingPreviewHasTableContent) return undefined;
          const allTableText = pendingPreviewSourceRefs.every(isTableTextSourceRef);
          if (allTableText) {
            const first = pendingPreviewSourceRefs[0] as TableTextSourceRef;
            const singleCell = pendingPreviewSourceRefs.every(
              (ref) =>
                isTableTextSourceRef(ref) &&
                ref.tableId === first.tableId &&
                ref.rowId === first.rowId &&
                ref.cellId === first.cellId
            );
            if (singleCell) return undefined;
            const table = document.tables.find((t) => t.id === first.tableId);
            const totalParts =
              table?.rows.flatMap((r) => r.cells.flatMap((c) => c.parts)).length ?? 0;
            const coveredParts = new Set(
              pendingPreviewSourceRefs
                .filter(isTableTextSourceRef)
                .map((ref) => `${ref.rowId}:${ref.cellId}:${ref.partId}`)
            ).size;
            if (totalParts > 0 && coveredParts < totalParts) {
              return (
                <Note variant="warning">
                  Partial table selections are not supported for rich text fields. Select the entire
                  table or just from a single cell instead.
                </Note>
              );
            }
          }
          return (
            <RichTextSelectionPreview
              document={document}
              sourceRefs={pendingPreviewSourceRefs}
              showTablePlaceholder={pendingPreviewHasTableContent}
            />
          );
        })()}
        onConfirmPrimary={handleEditModalConfirmPrimary}
      />
    </>
  );
};
