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

function buildDraftGroupsForTab(
  tab: Tab,
  visibleHighlightsBySegment: Record<string, MappingHighlight[]>,
  nextGroupIndex: { current: number },
  resolveFieldTypeLabel: (highlight: MappingHighlight) => string
): DraftMappingDisplayGroup[] {
  const groups: DraftMappingDisplayGroup[] = [];

  tab.segments.forEach((segment) => {
    const mappingCards = buildDraftMappingCards(
      segment,
      visibleHighlightsBySegment[segment.id] ?? [],
      resolveFieldTypeLabel
    );
    const mergeFieldIdentity =
      segment.kind === 'block' && mappingCards.length === 1 ? mappingCards[0].fieldIdentity : null;
    const previousGroup = groups[groups.length - 1];

    if (mergeFieldIdentity && previousGroup?.mergeFieldIdentity === mergeFieldIdentity) {
      previousGroup.segments.push(segment);
      previousGroup.mappingCards[0] = {
        ...previousGroup.mappingCards[0],
        mappingKeys: uniqueStrings([
          ...previousGroup.mappingCards[0].mappingKeys,
          ...mappingCards[0].mappingKeys,
        ]),
      };
      return;
    }

    groups.push({
      id: `mapping-display-group-${nextGroupIndex.current}`,
      segments: [segment],
      mappingCards: mappingCards.map((card) => ({
        ...card,
        key: `mapping-display-group-${nextGroupIndex.current}:${card.fieldIdentity}`,
      })),
      mergeFieldIdentity,
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
    showGroupedSurface: group.mergeFieldIdentity !== null,
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
