import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefCallback,
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
  AddEntryWizardParams,
  ReviewedReferenceGraph,
} from '@types';
import {
  isBlockImageSourceRef,
  isTableImageSourceRef,
  isTableTextSourceRef,
  isTextSourceRef,
} from '@types';
import { FileTextIcon, LightbulbIcon } from '@contentful/f36-icons';
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
  buildFieldOptionsForContentType,
  hasFieldId,
  isEntryReferenceField,
} from './fieldFormatting';
import { EditModal } from './edit-modals/EditModal';
import { RichTextSelectionPreview } from './edit-modals/RichTextSelectionPreview';

import { EditMappingButton } from './EditMappingButton';
import {
  mappingGroupSurfaceEdit,
  mappingGroupSurfaceView,
  mappingGroupSurfaceViewHovered,
} from './MappingView.styles';
import { buildSourceRefKey } from './sourceRefUtils';
import { MappingEntryCards } from './MappingEntryCards';
import { NormalizedDocumentSection } from './NormalizedDocumentSection';
import { buildMappingDisplayGroups, type MappingDisplayGroup } from './buildMappingDisplayGroups';
import { ViewMappingRail, type ViewMappingCardEntry } from './ViewMappingRail';
import {
  applyImageExclusionToEntryBlockGraph,
  appendImageToTargets,
  applyRichTextAssignToEntryBlockGraph,
  applyTextAssignToEntryBlockGraph,
  applyTextExclusionToEntryBlockGraph,
  collectRichTextSourceRefsFromSelection,
  selectionIncludesTableContent,
  collectTextAssignRangesFromSelection,
  collectTextExclusionRangesFromSelection,
  type TextExclusionRange,
} from './entryBlockGraphExclusion';

interface EditModalState {
  viewModel: EditModalContent;
  title: string;
  primaryButtonLabel: string;
}

interface MappingViewProps {
  payload: MappingReviewSuspendPayload;
  entryBlockGraph: EntryBlockGraph;
  onEntryBlockGraphChange: (next: EntryBlockGraph) => void;
  referenceGraph: ReviewedReferenceGraph;
  onReferenceGraphChange?: (next: ReviewedReferenceGraph) => void;
  selectedEntryIndex: number | null;
  defaultLocale: string;
  isDisabled?: boolean;
  mode?: 'view' | 'edit';
}

const EMPTY_EDIT_MODAL: EditModalState = {
  viewModel: {
    selectedText: '',
    isImageContent: false,
    currentLocations: [],
    newLocations: [],
    isOpen: false,
  },
  title: '',
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

/** `Range#intersectsNode` can throw when the range and node are in inconsistent trees. */
function rangeIntersectsNode(range: Range, node: Node): boolean {
  try {
    return range.intersectsNode(node);
  } catch {
    return false;
  }
}

function getViewModeGroupSurfaceFlags(
  isViewMode: boolean,
  group: MappingDisplayGroup,
  visibleHighlightsBySegment: Record<string, MappingHighlight[]>
): { isTableOnlyGroup: boolean; isImageOnlyGroup: boolean } {
  if (!isViewMode || group.segments.length !== 1) {
    return { isTableOnlyGroup: false, isImageOnlyGroup: false };
  }

  const onlySegment = group.segments[0];

  const isTableOnlyGroup = onlySegment?.kind === 'table';
  const isImageOnlyGroup =
    onlySegment?.kind === 'block' &&
    (visibleHighlightsBySegment[onlySegment.id] ?? []).every((h) => !isTextSourceRef(h.sourceRef));

  return { isTableOnlyGroup, isImageOnlyGroup };
}

export const MappingView = ({
  payload,
  entryBlockGraph,
  onEntryBlockGraphChange,
  referenceGraph,
  onReferenceGraphChange,
  selectedEntryIndex,
  defaultLocale,
  isDisabled = false,
  mode = 'view',
}: MappingViewProps): JSX.Element => {
  const isViewMode = mode === 'view';
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
  const [cardOffsetsByGroup, setCardOffsetsByGroup] = useState<
    Record<string, Record<string, number>>
  >({});
  const [cardHeightsByGroup, setCardHeightsByGroup] = useState<
    Record<string, Record<string, number>>
  >({});
  const [editModalState, setEditModalState] = useState<EditModalState>(EMPTY_EDIT_MODAL);
  const [pendingTextExclusionRanges, setPendingTextExclusionRanges] = useState<
    TextExclusionRange[] | null
  >(null);
  const [pendingExcludeImageSourceRefs, setPendingExcludeImageSourceRefs] = useState<
    ImageSourceRef[]
  >([]);
  const [pendingTextAssignRanges, setPendingTextAssignRanges] = useState<TextExclusionRange[]>([]);
  const [pendingPreviewSourceRefs, setPendingPreviewSourceRefs] = useState<SourceRef[]>([]);
  const [pendingPreviewHasTableContent, setPendingPreviewHasTableContent] = useState(false);
  const textSelectionRootRef = useRef<HTMLDivElement | null>(null);
  const groupLayoutRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cardWrapperRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const document = payload.normalizedDocument;

  const {
    selectionRectangle,
    selectedText,
    selectedRange,
    clearSelection,
    lockSelection: freezeSelection,
  } = useReviewTextSelection(textSelectionRootRef);

  const editButtonRef = useRef<HTMLDivElement>(null);

  const closeEditModal = () => {
    clearSelection();
    setEditModalState(EMPTY_EDIT_MODAL);
    setPendingTextExclusionRanges(null);
    setPendingExcludeImageSourceRefs([]);
    setPendingTextAssignRanges([]);
    setPendingPreviewSourceRefs([]);
    setPendingPreviewHasTableContent(false);
  };

  const handleDocumentKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab' && !e.shiftKey && selectedText.trim()) {
      const button = editButtonRef.current?.querySelector('button') as HTMLElement | null;
      if (button) {
        e.preventDefault();
        freezeSelection();
        button.focus();
      }
    }
  };

  const highlightIndex = useMemo(
    () => buildMappingHighlightIndex(entryBlockGraph, payload.contentTypes),
    [entryBlockGraph, payload.contentTypes]
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
    if (isViewMode || selectedEntryIndex === null) {
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
    const field = contentType?.fields.find((f) => f.id === fieldId);
    const fieldDisplayName = (field?.name ?? '').trim() || fieldId;
    const fieldDisplayType = field
      ? displayType(field.type ?? '', field.linkType, field.items)
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
      buildMappingDisplayGroups(tabs, visibleHighlightsBySegment, (highlight) => {
        const graphEntry = entryBlockGraph.entries[highlight.entryIndex];
        const contentType = payload.contentTypes.find(
          (item) => item.sys.id === graphEntry?.contentTypeId
        );
        const field = contentType?.fields.find((item) => item.id === highlight.fieldId);

        return field
          ? displayType(field.type ?? '', field.linkType, field.items)
          : displayType(highlight.fieldType);
      }),
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
          fieldName: card.fieldName,
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
    const entryTitle = getEntryTitleFromFieldMappings(entry, contentType?.displayField);

    return {
      id: entry.tempId ?? `${entry.contentTypeId}-${entryIndex}`,
      entryIndex,
      title: `${contentTypeName}: ${entryTitle}`,
      fieldOptions: buildFieldOptionsForContentType(contentType),
      fieldMappings: entry.fieldMappings.map((fieldMapping) => ({
        fieldId: fieldMapping.fieldId,
        sourceRefs: fieldMapping.sourceRefs,
      })),
      initialFieldIds: [],
    };
  };

  const allNewLocations = useMemo<EditModalNewLocation[]>(
    () => entryBlockGraph.entries.map((entry, idx) => getNewLocationForEntry(entry, idx)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute when entries or content types change
    [entryBlockGraph.entries, payload.contentTypes]
  );

  const buildNewLocationForContentType = (contentTypeId: string): EditModalNewLocation => {
    const contentType = payload.contentTypes.find((ct) => ct.sys.id === contentTypeId);
    return {
      id: `new-${contentTypeId}`,
      entryIndex: entryBlockGraph.entries.length,
      title: contentType?.name ?? contentTypeId,
      fieldOptions: buildFieldOptionsForContentType(contentType),
      fieldMappings: [],
      initialFieldIds: [],
    };
  };

  const existingEntriesForWizard = useMemo(
    () =>
      entryBlockGraph.entries.map((entry, idx) => {
        const contentType = payload.contentTypes.find((ct) => ct.sys.id === entry.contentTypeId);
        const contentTypeName = contentType?.name ?? entry.contentTypeId;
        const entryTitle = getEntryTitleFromFieldMappings(entry, contentType?.displayField);
        return {
          tempId: entry.tempId ?? `${entry.contentTypeId}-${idx}`,
          label: `${contentTypeName} (${entryTitle})`,
        };
      }),
    [entryBlockGraph.entries, payload.contentTypes]
  );

  const handleAddEntry = (params: AddEntryWizardParams) => {
    const { contentTypeId, fieldIds } = params;
    const isLinkedReference = params.isReference && !!params.referenceEntryId;
    const contentType = payload.contentTypes.find((ct) => ct.sys.id === contentTypeId);
    const newEntryIndex = entryBlockGraph.entries.length;
    const tempId = crypto.randomUUID();

    const refField =
      isLinkedReference
        ? contentType?.fields?.find(
            (f) =>
              f.id === params.referenceFieldId ||
              (!params.referenceFieldId && isEntryReferenceField(f))
          )
        : undefined;

    const newEntryFields: Record<string, Record<string, unknown>> = refField?.id
      ? {
          [refField.id]: {
            [defaultLocale]:
              refField.type === 'Array'
                ? [{ __ref: params.referenceEntryId }]
                : { __ref: params.referenceEntryId },
          },
        }
      : {};

    const newEntry = {
      contentTypeId,
      tempId,
      fields: newEntryFields,
      fieldMappings: [],
    };

    let next: EntryBlockGraph = {
      ...entryBlockGraph,
      entries: [...entryBlockGraph.entries, newEntry],
    };

    if (fieldIds.length > 0) {
      const resolvedTargets = fieldIds.flatMap((fieldId) => {
        const field = contentType?.fields?.find((f) => hasFieldId(f) && f.id === fieldId);
        const fieldType =
          field && 'type' in field && typeof field.type === 'string' ? field.type : 'Text';
        return [{ entryIndex: newEntryIndex, fieldId, fieldType }];
      });

      const richTextTargets = resolvedTargets.filter((t) => t.fieldType === 'RichText');
      const nonRichTextTargets = resolvedTargets.filter((t) => t.fieldType !== 'RichText');

      if (editModalState.viewModel.isImageContent) {
        const imageRef = pendingExcludeImageSourceRefs[0];
        if (imageRef) {
          if (nonRichTextTargets.length) {
            next = appendImageToTargets(next, imageRef, nonRichTextTargets);
          }
          if (richTextTargets.length) {
            next = applyRichTextAssignToEntryBlockGraph(
              next,
              document,
              [imageRef],
              richTextTargets
            );
          }
        }
      } else {
        if (richTextTargets.length && pendingPreviewSourceRefs.length) {
          next = applyRichTextAssignToEntryBlockGraph(
            next,
            document,
            pendingPreviewSourceRefs,
            richTextTargets
          );
        }
        const allRangesForAssign = [
          ...(pendingTextExclusionRanges ?? []),
          ...pendingTextAssignRanges,
        ];
        if (nonRichTextTargets.length && allRangesForAssign.length) {
          next = applyTextAssignToEntryBlockGraph(
            next,
            document,
            allRangesForAssign,
            nonRichTextTargets
          );
        }
      }
    }

    onEntryBlockGraphChange(next);

    if (isLinkedReference && onReferenceGraphChange) {
      onReferenceGraphChange({
        ...referenceGraph,
        edges: [
          ...(referenceGraph.edges ?? []),
          { from: tempId, to: params.referenceEntryId!, fieldId: '' },
        ],
      });
    }

    closeEditModal();
  };

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
      const nextHeights: Record<string, Record<string, number>> = {};

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
          const rawTop = anchorNode
            ? Math.max(0, anchorNode.getBoundingClientRect().top - groupTop)
            : 0;
          const height =
            wrapperNode?.getBoundingClientRect().height || wrapperNode?.offsetHeight || 28;

          return { key: card.key, rawTop, height };
        });

        nextOffsets[group.id] = resolveMarkerOffsets(cards);
        nextHeights[group.id] = Object.fromEntries(cards.map((c) => [c.key, c.height]));
      });

      setCardOffsetsByGroup(nextOffsets);
      setCardHeightsByGroup(nextHeights);
    };

    measureOffsets();

    const observer = new ResizeObserver(measureOffsets);
    Object.values(cardWrapperRefs.current).forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [allGroups]);

  const handleEditFromSelection = () => {
    if (isDisabled || !selectedText.trim()) return;
    const selectionRange = selectedRange ? selectedRange.cloneRange() : null;
    const exclusionRanges = collectTextExclusionRangesFromSelection(
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
    const currentLocations = getLocationsForSelectedText();

    const selectedSourceRefKeys = new Set(previewSourceRefs.map(buildSourceRefKey));
    const newLocationsWithInitial = allNewLocations.map((loc) => ({
      ...loc,
      initialFieldIds: loc.fieldMappings
        .filter((fm) =>
          fm.sourceRefs.some((sr) => selectedSourceRefKeys.has(buildSourceRefKey(sr)))
        )
        .map((fm) => fm.fieldId),
    }));

    setPendingTextExclusionRanges(exclusionRanges.length ? exclusionRanges : null);
    setPendingTextAssignRanges(assignRanges);
    setPendingPreviewSourceRefs(previewSourceRefs);
    setPendingPreviewHasTableContent(
      selectionIncludesTableContent(textSelectionRootRef.current, selectionRange)
    );
    setPendingExcludeImageSourceRefs(
      previewSourceRefs.filter(
        (ref): ref is ImageSourceRef => isBlockImageSourceRef(ref) || isTableImageSourceRef(ref)
      )
    );

    setEditModalState({
      viewModel: {
        selectedText: selectedText.trim(),
        isImageContent: false,
        currentLocations,
        newLocations: newLocationsWithInitial,
        isOpen: true,
      },
      title: 'Edit content mapping',
      primaryButtonLabel: 'Save',
    });
    clearSelection();
  };

  const handleEditImage = (sourceRef: ImageSourceRef, label: string) => {
    if (isDisabled) return;
    const currentLocations = getLocationsForSourceRef(sourceRef);

    const imageSourceRefKey = buildSourceRefKey(sourceRef);
    const newLocationsWithInitial = allNewLocations.map((loc) => ({
      ...loc,
      initialFieldIds: loc.fieldMappings
        .filter((fm) => fm.sourceRefs.some((sr) => buildSourceRefKey(sr) === imageSourceRefKey))
        .map((fm) => fm.fieldId),
    }));

    setPendingTextExclusionRanges(null);
    setPendingTextAssignRanges([]);
    setPendingPreviewSourceRefs([]);
    setPendingPreviewHasTableContent(false);
    setPendingExcludeImageSourceRefs([sourceRef]);

    setEditModalState({
      viewModel: {
        selectedText: label,
        isImageContent: true,
        currentLocations,
        newLocations: newLocationsWithInitial,
        isOpen: true,
      },
      title: 'Edit content mapping',
      primaryButtonLabel: 'Save',
    });
    setHoveredMappingKeys([]);
  };

  const handleEditModalConfirmPrimary = (selectionsByEntryId: Record<string, string[]>) => {
    const { isImageContent, newLocations } = editModalState.viewModel;
    let next = entryBlockGraph;

    for (const entryLoc of newLocations) {
      const selectedFieldIds = selectionsByEntryId[entryLoc.id] ?? [];
      const initialFieldIds = entryLoc.initialFieldIds;
      const addedFieldIds = selectedFieldIds.filter((id) => !initialFieldIds.includes(id));
      const removedFieldIds = initialFieldIds.filter((id) => !selectedFieldIds.includes(id));

      // ── REMOVALS for this entry ──
      for (const fieldId of removedFieldIds) {
        const fieldMapping = entryLoc.fieldMappings.find((fm) => fm.fieldId === fieldId);
        if (!fieldMapping) continue;

        const loc: EditLocationOption = {
          entryIndex: entryLoc.entryIndex,
          id: entryLoc.id,
          contentTypeId: '',
          contentTypeName: '',
          entryName: '',
          fieldId,
          fieldName: '',
          fieldType: '',
          sourceRef: fieldMapping.sourceRefs[0],
          sourceRefs: fieldMapping.sourceRefs,
        };

        const locSourceRefKeys = new Set(fieldMapping.sourceRefs.map(buildSourceRefKey));

        if (isImageContent) {
          const matchingImages = pendingExcludeImageSourceRefs.filter((ref) =>
            locSourceRefKeys.has(buildSourceRefKey(ref))
          );
          for (const imgRef of matchingImages) {
            next = applyImageExclusionToEntryBlockGraph(next, loc, imgRef);
          }
        } else {
          if (pendingTextExclusionRanges?.length) {
            next = applyTextExclusionToEntryBlockGraph(next, loc, pendingTextExclusionRanges);
          }
          const matchingImages = pendingExcludeImageSourceRefs.filter((ref) =>
            locSourceRefKeys.has(buildSourceRefKey(ref))
          );
          for (const imgRef of matchingImages) {
            next = applyImageExclusionToEntryBlockGraph(next, loc, imgRef);
          }
        }
      }

      // ── ADDITIONS for this entry ──
      if (addedFieldIds.length) {
        const entry = entryBlockGraph.entries[entryLoc.entryIndex];
        const contentType = entry
          ? payload.contentTypes.find((c) => c.sys.id === entry.contentTypeId)
          : undefined;

        const resolvedTargets = addedFieldIds.flatMap((fieldId) => {
          const field = contentType?.fields?.find((f) => hasFieldId(f) && f.id === fieldId);
          const fieldType =
            field && 'type' in field && typeof field.type === 'string' ? field.type : 'Text';
          return [{ entryIndex: entryLoc.entryIndex, fieldId, fieldType }];
        });

        if (isImageContent) {
          const imageRef = pendingExcludeImageSourceRefs[0];
          if (imageRef) {
            const assetTargets = resolvedTargets.filter((t) => t.fieldType !== 'RichText');
            const richTextTargets = resolvedTargets.filter((t) => t.fieldType === 'RichText');

            if (assetTargets.length) {
              next = appendImageToTargets(next, imageRef, assetTargets);
            }
            if (richTextTargets.length) {
              next = applyRichTextAssignToEntryBlockGraph(
                next,
                document,
                [imageRef],
                richTextTargets
              );
              const imageKey = buildSourceRefKey(imageRef);
              next = {
                ...next,
                excludedSourceRefs: next.excludedSourceRefs.filter(
                  (r) => buildSourceRefKey(r) !== imageKey
                ),
              };
            }
          }
        } else {
          const richTextTargets = resolvedTargets.filter((t) => t.fieldType === 'RichText');
          const nonRichTextTargets = resolvedTargets.filter((t) => t.fieldType !== 'RichText');

          if (richTextTargets.length && pendingPreviewSourceRefs.length) {
            next = applyRichTextAssignToEntryBlockGraph(
              next,
              document,
              pendingPreviewSourceRefs,
              richTextTargets
            );
          }

          const allRangesForAssign = [
            ...(pendingTextExclusionRanges ?? []),
            ...pendingTextAssignRanges,
          ];
          if (nonRichTextTargets.length && allRangesForAssign.length) {
            next = applyTextAssignToEntryBlockGraph(
              next,
              document,
              allRangesForAssign,
              nonRichTextTargets
            );
          }
        }
      }
    }

    if (next !== entryBlockGraph) onEntryBlockGraphChange(next);
    closeEditModal();
  };

  const viewCardsByGroup = useMemo((): Record<string, ViewMappingCardEntry[]> => {
    const result: Record<string, ViewMappingCardEntry[]> = {};

    allGroups.forEach((group) => {
      const cards: ViewMappingCardEntry[] = [];

      group.mappingCards.forEach((card) => {
        const location = locationsByCardKey.get(card.key);
        if (!location) return;

        const graphEntry = entryBlockGraph.entries[location.entryIndex];
        const contentType = payload.contentTypes.find(
          (ct) => ct.sys.id === graphEntry?.contentTypeId
        );
        const contentTypeName = (contentType?.name ?? graphEntry?.contentTypeId ?? '').trim();
        const entryName = getEntryTitleFromFieldMappings(graphEntry, contentType?.displayField);
        const field = contentType?.fields.find((f) => f.id === location.fieldId);
        const fieldType = field
          ? displayType(field.type ?? '', field.linkType, field.items)
          : location.fieldType;

        cards.push({
          key: card.key,
          mappingKeys: card.mappingKeys,
          contentTypeName,
          entryName,
          fieldName: card.fieldName,
          fieldType,
        });
      });

      result[group.id] = cards;
    });

    return result;
  }, [allGroups, locationsByCardKey, entryBlockGraph.entries, payload.contentTypes]);

  return (
    <>
      <Flex
        ref={textSelectionRootRef}
        contentEditable={!isViewMode || undefined}
        suppressContentEditableWarning
        onBeforeInput={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        onKeyDown={handleDocumentKeyDown}
        flexDirection="column"
        gap="spacingS"
        style={{ marginTop: tokens.spacingM, outline: 'none' }}>
        {(isViewMode || selectedEntryRow) && (
          <Flex
            gap="spacingM"
            alignItems="flex-end"
            style={{
              borderBottom: `1px solid ${tokens.gray200}`,
              paddingBottom: tokens.spacingXs,
            }}>
            <Box style={{ flex: 2 }}>
              <Text
                as="p"
                fontSize="fontSizeS"
                fontWeight="fontWeightMedium"
                marginBottom="spacing2Xs">
                Currently viewing:
              </Text>
              <Text as="p" marginBottom="none">
                {isViewMode ? (
                  <Text as="span" fontWeight="fontWeightDemiBold">
                    All entries ({entryBlockGraph.entries.length})
                  </Text>
                ) : (
                  <>
                    <Text as="span" fontWeight="fontWeightDemiBold">
                      {selectedEntryRow!.contentTypeName}
                    </Text>
                    {selectedEntryRow!.entryTitle ? (
                      <Text as="span" fontColor="gray600">
                        {' '}
                        ({selectedEntryRow!.entryTitle})
                      </Text>
                    ) : null}
                  </>
                )}
              </Text>
            </Box>
            <Flex alignItems="center" gap="spacing2Xs" style={{ flex: '0 0 280px', maxWidth: 280 }}>
              <LightbulbIcon size="tiny" style={{ color: tokens.gray600, flexShrink: 0 }} />
              <Text as="span" fontSize="fontSizeS" fontColor="gray600">
                Tip: hover over a card to highlight its content
              </Text>
            </Flex>
          </Flex>
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
              {(groupsByTab[tab.id] ?? []).map((group) => {
                const { isTableOnlyGroup, isImageOnlyGroup } = getViewModeGroupSurfaceFlags(
                  isViewMode,
                  group,
                  visibleHighlightsBySegment
                );

                const showSurface = isViewMode
                  ? group.mappingCards.length > 0 && !isTableOnlyGroup && !isImageOnlyGroup
                  : group.showGroupedSurface;

                const isGroupSurfaceHovered =
                  isViewMode &&
                  group.mappingCards.some((card) =>
                    card.mappingKeys.some((key) => hoveredMappingKeys.includes(key))
                  );

                const surfaceClassName = isViewMode
                  ? isGroupSurfaceHovered
                    ? mappingGroupSurfaceViewHovered
                    : mappingGroupSurfaceView
                  : mappingGroupSurfaceEdit;

                return (
                  <Box key={group.id}>
                    <Flex
                      gap="spacingM"
                      alignItems="stretch"
                      data-testid={`display-group-layout-${group.id}`}
                      ref={setGroupLayoutRef(group.id)}>
                      <Box style={{ flex: 2 }}>
                        {showSurface ? (
                          <Box
                            data-testid={`mapping-group-surface-${group.id}`}
                            className={surfaceClassName}>
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
                                  isViewMode={isViewMode}
                                  onSetHoveredMappingKeys={setHoveredMappingKeys}
                                  onEditImage={isViewMode ? undefined : handleEditImage}
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
                                isViewMode={isViewMode}
                                onSetHoveredMappingKeys={setHoveredMappingKeys}
                                onEditImage={isViewMode ? undefined : handleEditImage}
                              />
                            ))}
                          </Flex>
                        )}
                      </Box>

                      {isViewMode ? (
                        <ViewMappingRail
                          segmentId={group.id}
                          cards={viewCardsByGroup[group.id] ?? []}
                          hoveredMappingKeys={hoveredMappingKeys}
                          onSetHoveredMappingKeys={setHoveredMappingKeys}
                        />
                      ) : (
                        <MappingEntryCards
                          groupId={group.id}
                          mappingCards={group.mappingCards}
                          cardOffsetsByGroup={cardOffsetsByGroup}
                          cardHeightsByGroup={cardHeightsByGroup}
                          hoveredMappingKeys={hoveredMappingKeys}
                          onSetHoveredMappingKeys={setHoveredMappingKeys}
                          setCardWrapperRef={setCardWrapperRef}
                        />
                      )}
                    </Flex>
                  </Box>
                );
              })}
            </Flex>
          </Box>
        ))}
      </Flex>

      {selectionRectangle && !isDisabled && !isViewMode ? (
        <EditMappingButton
          ref={editButtonRef}
          anchorRectangle={selectionRectangle}
          onEdit={handleEditFromSelection}
          onBlur={clearSelection}
        />
      ) : null}

      <EditModal
        isOpen={editModalState.viewModel.isOpen}
        onClose={closeEditModal}
        viewModel={editModalState.viewModel}
        title={editModalState.title}
        primaryButtonLabel={editModalState.primaryButtonLabel}
        contentTypes={payload.contentTypes}
        existingEntries={existingEntriesForWizard}
        onAddEntry={handleAddEntry}
        buildNewLocationForContentType={buildNewLocationForContentType}
        additionalContent={(() => {
          if (!pendingPreviewSourceRefs.length && !pendingPreviewHasTableContent) return undefined;
          const allTableText = pendingPreviewSourceRefs.every(isTableTextSourceRef);
          if (allTableText && pendingPreviewSourceRefs.length > 0) {
            const first = pendingPreviewSourceRefs[0] as TableTextSourceRef;
            const singleCell = pendingPreviewSourceRefs.every(
              (ref) =>
                isTableTextSourceRef(ref) &&
                ref.tableId === first.tableId &&
                ref.rowId === first.rowId &&
                ref.cellId === first.cellId
            );
            if (!singleCell) {
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
                    Partial table selections are not supported for rich text fields. Select the
                    entire table or just from a single cell instead.
                  </Note>
                );
              }
            }
          }
          return (
            <RichTextSelectionPreview
              document={document}
              sourceRefs={pendingPreviewSourceRefs}
              selectionIncludesTableContent={pendingPreviewHasTableContent}
            />
          );
        })()}
        onConfirmPrimary={handleEditModalConfirmPrimary}
      />
    </>
  );
};
