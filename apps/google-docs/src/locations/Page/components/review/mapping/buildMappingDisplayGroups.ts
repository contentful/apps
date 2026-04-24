import { isBlockImageSourceRef, isTableImageSourceRef, isTextSourceRef } from '@types';
import type { MappingCardData } from './MappingCard';
import type { Tab, DocSegment } from './buildDocument';
import { type MappingHighlight, getMappingCardKey } from './buildHighlights';
import { getAnchorIdForSourceRef } from './resolveMappingCardOffsets';

export interface RenderedMappingCard extends MappingCardData {
  fieldIdentity: string;
  anchorId: string;
  mappingKeys: string[];
  entryLabel: string;
  hasTextSourceRefs: boolean;
  hasImageSourceRefs: boolean;
}

export interface MappingDisplayGroup {
  id: string;
  segments: DocSegment[];
  mappingCards: RenderedMappingCard[];
  showGroupedSurface: boolean;
  hasTextSourceRefs: boolean;
  hasImageSourceRefs: boolean;
}

interface DraftMappingCard extends MappingCardData {
  fieldIdentity: string;
  anchorId: string;
  mappingKeys: string[];
  entryLabel: string;
  hasTextSourceRefs: boolean;
  hasImageSourceRefs: boolean;
}

interface DraftMappingDisplayGroup {
  id: string;
  segments: DocSegment[];
  mappingCards: DraftMappingCard[];
  mergeFieldIdentity: string | null;
  startsAtBoundary: boolean;
  endsAtBoundary: boolean;
}

export interface MappingDisplayGroupsResult {
  groupsByTab: Record<string, MappingDisplayGroup[]>;
  allGroups: MappingDisplayGroup[];
}

function getFieldIdentity(highlight: MappingHighlight): string {
  return `${highlight.entryIndex}|${highlight.fieldId}|${highlight.fieldType}`;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

const GROUPABLE_SEPARATOR_PATTERN = /^[\s/|,:;()[\]{}\-–—]+$/;

function getTextSliceFromRuns(
  flattenedRuns: Array<{ start: number; end: number; text: string }>,
  from: number,
  to: number
): string {
  if (to <= from) {
    return '';
  }

  return flattenedRuns
    .flatMap((run) => {
      const overlapStart = Math.max(from, run.start);
      const overlapEnd = Math.min(to, run.end);

      if (overlapEnd <= overlapStart) {
        return [];
      }

      return [run.text.slice(overlapStart - run.start, overlapEnd - run.start)];
    })
    .join('');
}

function isOnlyGroupableSeparators(value: string): boolean {
  return value.length === 0 || GROUPABLE_SEPARATOR_PATTERN.test(value);
}

function buildDraftMappingCards(
  segment: DocSegment,
  highlights: MappingHighlight[],
  resolveFieldTypeLabel: (highlight: MappingHighlight) => string,
  resolveContentTypeName: (highlight: MappingHighlight) => string,
  resolveEntryLabel: (highlight: MappingHighlight) => string
): DraftMappingCard[] {
  if (segment.kind === 'table') {
    const cards: DraftMappingCard[] = [];
    const highlightsByPartKey = new Map<string, MappingHighlight[]>();

    const hasFullPartTextCoverage = (
      highlightsForPart: MappingHighlight[],
      expectedStart: number,
      flattenedRuns: Array<{ start: number; end: number; text: string }>,
      expectedEnd: number
    ): boolean => {
      const textHighlights = highlightsForPart.filter(
        (
          highlight
        ): highlight is MappingHighlight & {
          sourceRef: Extract<MappingHighlight['sourceRef'], { start: number; end: number }>;
        } => isTextSourceRef(highlight.sourceRef)
      );

      if (!textHighlights.length || textHighlights.length !== highlightsForPart.length) {
        return false;
      }

      const sortedHighlights = [...textHighlights].sort(
        (left, right) => left.sourceRef.start - right.sourceRef.start
      );
      let coverageEnd = sortedHighlights[0].sourceRef.end;

      if (
        !isOnlyGroupableSeparators(
          getTextSliceFromRuns(flattenedRuns, expectedStart, sortedHighlights[0].sourceRef.start)
        )
      ) {
        return false;
      }

      for (let index = 1; index < sortedHighlights.length; index += 1) {
        const highlight = sortedHighlights[index];
        if (
          !isOnlyGroupableSeparators(
            getTextSliceFromRuns(flattenedRuns, coverageEnd, highlight.sourceRef.start)
          )
        ) {
          return false;
        }
        coverageEnd = Math.max(coverageEnd, highlight.sourceRef.end);
      }

      return isOnlyGroupableSeparators(
        getTextSliceFromRuns(flattenedRuns, coverageEnd, expectedEnd)
      );
    };

    highlights.forEach((highlight) => {
      if (!('partId' in highlight.sourceRef)) {
        const mappingKey = getMappingCardKey(segment.id, highlight);
        cards.push({
          key: `${segment.id}:${mappingKey}`,
          fieldIdentity: getFieldIdentity(highlight),
          contentTypeName: resolveContentTypeName(highlight),
          fieldName: highlight.fieldName,
          fieldType: resolveFieldTypeLabel(highlight),
          displayLabel: highlight.fieldName,
          anchorId: getAnchorIdForSourceRef(highlight.sourceRef),
          mappingKeys: [mappingKey],
          entryLabel: resolveEntryLabel(highlight),
          hasTextSourceRefs: isTextSourceRef(highlight.sourceRef),
          hasImageSourceRefs:
            isBlockImageSourceRef(highlight.sourceRef) ||
            isTableImageSourceRef(highlight.sourceRef),
        });
        return;
      }

      const partKey = [
        highlight.sourceRef.tableId,
        highlight.sourceRef.rowId,
        highlight.sourceRef.cellId,
        highlight.sourceRef.partId,
      ].join(':');
      const existing = highlightsByPartKey.get(partKey) ?? [];
      existing.push(highlight);
      highlightsByPartKey.set(partKey, existing);
    });

    let currentCard: DraftMappingCard | null = null;
    const flushCurrentCard = () => {
      if (currentCard) {
        cards.push(currentCard);
        currentCard = null;
      }
    };

    segment.table.rows.forEach((row) => {
      row.cells.forEach((cell) => {
        cell.parts.forEach((part) => {
          const partKey = [segment.table.id, row.id, cell.id, part.id].join(':');
          const partHighlights = highlightsByPartKey.get(partKey) ?? [];

          if (!partHighlights.length) {
            flushCurrentCard();
            return;
          }

          const uniqueFieldIdentities = new Set(partHighlights.map(getFieldIdentity));
          const canGroupPart =
            uniqueFieldIdentities.size === 1 &&
            (part.type === 'image' ||
              (part.type === 'text' &&
                hasFullPartTextCoverage(
                  partHighlights,
                  part.flattenedTextRuns[0]?.start ?? 0,
                  part.flattenedTextRuns,
                  part.flattenedTextRuns[part.flattenedTextRuns.length - 1]?.end ?? 0
                )));

          if (!canGroupPart) {
            flushCurrentCard();
            if (part.type !== 'text') {
              partHighlights.forEach((highlight) => {
                const mappingKey = getMappingCardKey(segment.id, highlight);
                cards.push({
                  key: `${segment.id}:${mappingKey}`,
                  fieldIdentity: getFieldIdentity(highlight),
                  contentTypeName: resolveContentTypeName(highlight),
                  fieldName: highlight.fieldName,
                  fieldType: resolveFieldTypeLabel(highlight),
                  displayLabel: highlight.fieldName,
                  anchorId: getAnchorIdForSourceRef(highlight.sourceRef),
                  mappingKeys: [mappingKey],
                  entryLabel: resolveEntryLabel(highlight),
                  hasTextSourceRefs: isTextSourceRef(highlight.sourceRef),
                  hasImageSourceRefs:
                    isBlockImageSourceRef(highlight.sourceRef) ||
                    isTableImageSourceRef(highlight.sourceRef),
                });
              });
            } else {
              const firstHighlight = partHighlights[0];
              cards.push({
                key: `${segment.id}:${partKey}:${getFieldIdentity(firstHighlight)}`,
                fieldIdentity: getFieldIdentity(firstHighlight),
                contentTypeName: resolveContentTypeName(firstHighlight),
                fieldName: firstHighlight.fieldName,
                fieldType: resolveFieldTypeLabel(firstHighlight),
                displayLabel: firstHighlight.fieldName,
                anchorId: getAnchorIdForSourceRef(firstHighlight.sourceRef),
                mappingKeys: uniqueStrings(
                  partHighlights.map((highlight) => getMappingCardKey(segment.id, highlight))
                ),
                entryLabel: resolveEntryLabel(firstHighlight),
                hasTextSourceRefs: true,
                hasImageSourceRefs: false,
              });
            }
            return;
          }

          const firstHighlight = partHighlights[0];
          const fieldIdentity = getFieldIdentity(firstHighlight);
          const mappingKeys = uniqueStrings(
            partHighlights.map((highlight) => getMappingCardKey(segment.id, highlight))
          );

          if (currentCard?.fieldIdentity === fieldIdentity) {
            currentCard.mappingKeys = uniqueStrings([...currentCard.mappingKeys, ...mappingKeys]);
            return;
          }

          flushCurrentCard();
          currentCard = {
            key: `${segment.id}:${getMappingCardKey(segment.id, firstHighlight)}`,
            fieldIdentity,
            contentTypeName: resolveContentTypeName(firstHighlight),
            fieldName: firstHighlight.fieldName,
            fieldType: resolveFieldTypeLabel(firstHighlight),
            displayLabel: firstHighlight.fieldName,
            anchorId: getAnchorIdForSourceRef(firstHighlight.sourceRef),
            mappingKeys,
            entryLabel: resolveEntryLabel(firstHighlight),
            hasTextSourceRefs: partHighlights.some((highlight) =>
              isTextSourceRef(highlight.sourceRef)
            ),
            hasImageSourceRefs: partHighlights.some(
              (highlight) =>
                isBlockImageSourceRef(highlight.sourceRef) ||
                isTableImageSourceRef(highlight.sourceRef)
            ),
          };
        });
      });
    });

    flushCurrentCard();
    return cards;
  }

  const byFieldIdentity = new Map<
    string,
    {
      firstHighlight: MappingHighlight;
      mappingKeys: string[];
      hasTextSourceRefs: boolean;
      hasImageSourceRefs: boolean;
    }
  >();

  highlights.forEach((highlight) => {
    const fieldIdentity = getFieldIdentity(highlight);
    const mappingKey = getMappingCardKey(segment.id, highlight);
    const existing = byFieldIdentity.get(fieldIdentity);

    if (existing) {
      existing.mappingKeys.push(mappingKey);
      existing.hasTextSourceRefs ||= isTextSourceRef(highlight.sourceRef);
      existing.hasImageSourceRefs ||=
        isBlockImageSourceRef(highlight.sourceRef) || isTableImageSourceRef(highlight.sourceRef);
      return;
    }

    byFieldIdentity.set(fieldIdentity, {
      firstHighlight: highlight,
      mappingKeys: [mappingKey],
      hasTextSourceRefs: isTextSourceRef(highlight.sourceRef),
      hasImageSourceRefs:
        isBlockImageSourceRef(highlight.sourceRef) || isTableImageSourceRef(highlight.sourceRef),
    });
  });

  return Array.from(byFieldIdentity.entries()).map(([fieldIdentity, value]) => ({
    key: `${segment.id}:${fieldIdentity}`,
    fieldIdentity,
    contentTypeName: resolveContentTypeName(value.firstHighlight),
    fieldName: value.firstHighlight.fieldName,
    fieldType: resolveFieldTypeLabel(value.firstHighlight),
    displayLabel: value.firstHighlight.fieldName,
    anchorId: getAnchorIdForSourceRef(value.firstHighlight.sourceRef),
    mappingKeys: uniqueStrings(value.mappingKeys),
    entryLabel: resolveEntryLabel(value.firstHighlight),
    hasTextSourceRefs: value.hasTextSourceRefs,
    hasImageSourceRefs: value.hasImageSourceRefs,
  }));
}

function getBlockBoundaryCoverage(
  segment: Extract<DocSegment, { kind: 'block' }>,
  highlights: MappingHighlight[],
  fieldIdentity: string
): { startsAtBoundary: boolean; endsAtBoundary: boolean } {
  const blockStart = segment.block.flattenedTextRuns[0]?.start;
  const blockEnd = segment.block.flattenedTextRuns[segment.block.flattenedTextRuns.length - 1]?.end;

  if (!Number.isFinite(blockStart) || !Number.isFinite(blockEnd)) {
    return { startsAtBoundary: false, endsAtBoundary: false };
  }

  const textHighlights = highlights.filter(
    (
      highlight
    ): highlight is MappingHighlight & {
      sourceRef: Extract<MappingHighlight['sourceRef'], { start: number; end: number }>;
    } => getFieldIdentity(highlight) === fieldIdentity && isTextSourceRef(highlight.sourceRef)
  );

  if (!textHighlights.length) {
    return { startsAtBoundary: false, endsAtBoundary: false };
  }

  return {
    startsAtBoundary: textHighlights.some((highlight) => highlight.sourceRef.start <= blockStart),
    endsAtBoundary: textHighlights.some((highlight) => highlight.sourceRef.end >= blockEnd),
  };
}

function buildDraftGroupsForTab(
  tab: Tab,
  visibleHighlightsBySegment: Record<string, MappingHighlight[]>,
  nextGroupIndex: { current: number },
  resolveFieldTypeLabel: (highlight: MappingHighlight) => string,
  resolveContentTypeName: (highlight: MappingHighlight) => string,
  resolveEntryLabel: (highlight: MappingHighlight) => string
): DraftMappingDisplayGroup[] {
  const groups: DraftMappingDisplayGroup[] = [];

  tab.segments.forEach((segment) => {
    const highlights = visibleHighlightsBySegment[segment.id] ?? [];
    const mappingCards = buildDraftMappingCards(
      segment,
      highlights,
      resolveFieldTypeLabel,
      resolveContentTypeName,
      resolveEntryLabel
    );
    const { startsAtBoundary, endsAtBoundary } =
      segment.kind === 'block' && segment.block.type !== 'heading' && mappingCards.length === 1
        ? getBlockBoundaryCoverage(segment, highlights, mappingCards[0].fieldIdentity)
        : { startsAtBoundary: false, endsAtBoundary: false };
    const mergeFieldIdentity =
      segment.kind === 'block' && mappingCards.length === 1 && (startsAtBoundary || endsAtBoundary)
        ? mappingCards[0].fieldIdentity
        : null;
    const previousGroup = groups[groups.length - 1];

    if (
      mergeFieldIdentity &&
      previousGroup?.mergeFieldIdentity === mergeFieldIdentity &&
      previousGroup.endsAtBoundary &&
      startsAtBoundary
    ) {
      previousGroup.segments.push(segment);
      previousGroup.mappingCards[0] = {
        ...previousGroup.mappingCards[0],
        mappingKeys: uniqueStrings([
          ...previousGroup.mappingCards[0].mappingKeys,
          ...mappingCards[0].mappingKeys,
        ]),
      };
      previousGroup.endsAtBoundary = endsAtBoundary;
      return;
    }

    groups.push({
      id: `mapping-display-group-${nextGroupIndex.current}`,
      segments: [segment],
      mappingCards: mappingCards.map((card) => ({
        ...card,
        key: `mapping-display-group-${nextGroupIndex.current}:${card.key}`,
      })),
      mergeFieldIdentity,
      startsAtBoundary,
      endsAtBoundary,
    });
    nextGroupIndex.current += 1;
  });

  return groups;
}

export function buildMappingDisplayGroups(
  tabs: Tab[],
  visibleHighlightsBySegment: Record<string, MappingHighlight[]>,
  resolveFieldTypeLabel: (highlight: MappingHighlight) => string,
  resolveContentTypeName: (highlight: MappingHighlight) => string,
  resolveEntryLabel: (highlight: MappingHighlight) => string
): MappingDisplayGroupsResult {
  const groupsByTabDraft: Record<string, DraftMappingDisplayGroup[]> = {};
  const nextGroupIndex = { current: 0 };

  tabs.forEach((tab) => {
    groupsByTabDraft[tab.id] = buildDraftGroupsForTab(
      tab,
      visibleHighlightsBySegment,
      nextGroupIndex,
      resolveFieldTypeLabel,
      resolveContentTypeName,
      resolveEntryLabel
    );
  });

  const allDraftGroups = tabs.flatMap((tab) => groupsByTabDraft[tab.id] ?? []);
  const totalByFieldIdentity = new Map<string, number>();

  allDraftGroups.forEach((group) => {
    group.mappingCards.forEach((card) => {
      totalByFieldIdentity.set(
        card.fieldIdentity,
        (totalByFieldIdentity.get(card.fieldIdentity) ?? 0) + 1
      );
    });
  });

  const positionByFieldIdentity = new Map<string, number>();
  const finalizeGroup = (group: DraftMappingDisplayGroup): MappingDisplayGroup => ({
    id: group.id,
    segments: group.segments,
    showGroupedSurface:
      group.segments.length > 1 || (group.startsAtBoundary && group.endsAtBoundary),
    hasTextSourceRefs: group.mappingCards.some((card) => card.hasTextSourceRefs),
    hasImageSourceRefs: group.mappingCards.some((card) => card.hasImageSourceRefs),
    mappingCards: group.mappingCards.map((card) => {
      const nextPosition = (positionByFieldIdentity.get(card.fieldIdentity) ?? 0) + 1;
      positionByFieldIdentity.set(card.fieldIdentity, nextPosition);
      const total = totalByFieldIdentity.get(card.fieldIdentity) ?? 1;

      return {
        ...card,
        displayLabel: total > 1 ? `${card.fieldName} (${nextPosition}/${total})` : card.fieldName,
      };
    }),
  });

  const groupsByTab = tabs.reduce<Record<string, MappingDisplayGroup[]>>((acc, tab) => {
    acc[tab.id] = (groupsByTabDraft[tab.id] ?? []).map(finalizeGroup);
    return acc;
  }, {});

  return {
    groupsByTab,
    allGroups: tabs.flatMap((tab) => groupsByTab[tab.id] ?? []),
  };
}
