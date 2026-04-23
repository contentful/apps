import { isTextSourceRef } from '@types';
import type { MappingCardData } from './MappingCard';
import type { Tab, DocSegment } from './buildDocument';
import { type MappingHighlight, getMappingCardKey } from './buildHighlights';
import { formatDisplayName } from './fieldFormatting';
import { getAnchorIdForSourceRef } from './resolveMappingCardOffsets';

export interface RenderedMappingCard extends MappingCardData {
  fieldIdentity: string;
  anchorId: string;
  mappingKeys: string[];
}

export interface MappingDisplayGroup {
  id: string;
  segments: DocSegment[];
  mappingCards: RenderedMappingCard[];
  showGroupedSurface: boolean;
}

interface DraftMappingCard extends MappingCardData {
  fieldIdentity: string;
  anchorId: string;
  mappingKeys: string[];
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

function buildDraftMappingCards(
  segment: DocSegment,
  highlights: MappingHighlight[],
  resolveFieldTypeLabel: (highlight: MappingHighlight) => string
): DraftMappingCard[] {
  if (segment.kind === 'table') {
    return highlights.map((highlight) => {
      const mappingKey = getMappingCardKey(segment.id, highlight);

      return {
        key: `${segment.id}:${mappingKey}`,
        fieldIdentity: getFieldIdentity(highlight),
        fieldName: formatDisplayName(highlight.fieldId),
        fieldType: resolveFieldTypeLabel(highlight),
        displayLabel: formatDisplayName(highlight.fieldId),
        anchorId: getAnchorIdForSourceRef(highlight.sourceRef),
        mappingKeys: [mappingKey],
      };
    });
  }

  const byFieldIdentity = new Map<
    string,
    { firstHighlight: MappingHighlight; mappingKeys: string[] }
  >();

  highlights.forEach((highlight) => {
    const fieldIdentity = getFieldIdentity(highlight);
    const mappingKey = getMappingCardKey(segment.id, highlight);
    const existing = byFieldIdentity.get(fieldIdentity);

    if (existing) {
      existing.mappingKeys.push(mappingKey);
      return;
    }

    byFieldIdentity.set(fieldIdentity, {
      firstHighlight: highlight,
      mappingKeys: [mappingKey],
    });
  });

  return Array.from(byFieldIdentity.entries()).map(([fieldIdentity, value]) => ({
    key: `${segment.id}:${fieldIdentity}`,
    fieldIdentity,
    fieldName: formatDisplayName(value.firstHighlight.fieldId),
    fieldType: resolveFieldTypeLabel(value.firstHighlight),
    displayLabel: formatDisplayName(value.firstHighlight.fieldId),
    anchorId: getAnchorIdForSourceRef(value.firstHighlight.sourceRef),
    mappingKeys: uniqueStrings(value.mappingKeys),
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
  resolveFieldTypeLabel: (highlight: MappingHighlight) => string
): DraftMappingDisplayGroup[] {
  const groups: DraftMappingDisplayGroup[] = [];

  tab.segments.forEach((segment) => {
    const highlights = visibleHighlightsBySegment[segment.id] ?? [];
    const mappingCards = buildDraftMappingCards(segment, highlights, resolveFieldTypeLabel);
    const { startsAtBoundary, endsAtBoundary } =
      segment.kind === 'block' && mappingCards.length === 1
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
  resolveFieldTypeLabel: (highlight: MappingHighlight) => string
): MappingDisplayGroupsResult {
  const groupsByTabDraft: Record<string, DraftMappingDisplayGroup[]> = {};
  const nextGroupIndex = { current: 0 };

  tabs.forEach((tab) => {
    groupsByTabDraft[tab.id] = buildDraftGroupsForTab(
      tab,
      visibleHighlightsBySegment,
      nextGroupIndex,
      resolveFieldTypeLabel
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
