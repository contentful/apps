import type {
  EditLocationOption,
  FieldMapping,
  EntryBlockGraph,
  ImageSourceRef,
  NormalizedDocument,
  NormalizedDocumentContentBlock,
  NormalizedDocumentFlattenedRun,
  SourceRef,
  TextRangeSourceRef,
} from '@types';
import {
  isBlockImageSourceRef,
  isTableImageSourceRef,
  isTableSourceRef,
  isTableTextSourceRef,
  isTextSourceRef,
} from '@types';
import { buildSourceRefKey } from './sourceRefUtils';
import { normalizeRichTextSourceRefs } from './normalizeRichTextSourceRefs';

export type TextExclusionRange =
  | { scope: 'block'; blockId: string; start: number; end: number }
  | {
      scope: 'table';
      tableId: string;
      rowId: string;
      cellId: string;
      partId: string;
      start: number;
      end: number;
    };

type RichTextSelectionOptions = {
  mappingKeys?: ReadonlySet<string>;
  mappedState?: 'mapped' | 'unmapped' | 'any';
};

type RichTextSelectionItem =
  | { kind: 'text'; range: TextExclusionRange }
  | { kind: 'image'; sourceRef: ImageSourceRef };

function mergeIntervals(intervals: [number, number][]): [number, number][] {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of sorted) {
    if (e <= s) continue;
    const last = merged[merged.length - 1];
    if (!last || s > last[1]) merged.push([s, e]);
    else last[1] = Math.max(last[1], e);
  }
  return merged;
}

function subtractIntervalsFromSpan(
  spanStart: number,
  spanEnd: number,
  remove: [number, number][]
): [number, number][] {
  const cuts = mergeIntervals(
    remove
      .map(([s, e]) => [Math.max(s, spanStart), Math.min(e, spanEnd)] as [number, number])
      .filter(([s, e]) => s < e)
  );
  if (!cuts.length) return [[spanStart, spanEnd]];
  const out: [number, number][] = [];
  let cur = spanStart;
  for (const [cs, ce] of cuts) {
    if (cur < cs) out.push([cur, cs]);
    cur = Math.max(cur, ce);
  }
  if (cur < spanEnd) out.push([cur, spanEnd]);
  return out;
}

function clipFlattenedRuns(
  runs: NormalizedDocumentFlattenedRun[],
  segStart: number,
  segEnd: number
): NormalizedDocumentFlattenedRun[] {
  const out: NormalizedDocumentFlattenedRun[] = [];
  for (const run of runs) {
    const innerStart = Math.max(run.start, segStart);
    const innerEnd = Math.min(run.end, segEnd);
    if (innerStart >= innerEnd) continue;
    const textSliceStart = innerStart - run.start;
    const textSliceEnd = innerEnd - run.start;
    out.push({
      ...run,
      start: innerStart,
      end: innerEnd,
      text: run.text.slice(textSliceStart, textSliceEnd),
    });
  }
  return out;
}

function buildTextRefsFromSpans(
  baseRef: TextRangeSourceRef,
  spans: [number, number][]
): TextRangeSourceRef[] {
  return spans.map(([s, e]) => ({
    ...baseRef,
    start: s,
    end: e,
    flattenedRuns: clipFlattenedRuns(baseRef.flattenedRuns, s, e),
  }));
}

function intersectSpan(
  refStart: number,
  refEnd: number,
  rStart: number,
  rEnd: number
): [number, number] | null {
  const start = Math.max(refStart, rStart);
  const end = Math.min(refEnd, rEnd);
  if (start >= end) return null;
  return [start, end];
}

function rangesOverlappingTextSourceRef(
  ref: TextRangeSourceRef,
  pending: TextExclusionRange[]
): [number, number][] {
  const cuts: [number, number][] = [];
  for (const r of pending) {
    if (r.scope === 'block' && 'blockId' in ref && !isTableSourceRef(ref)) {
      if (r.blockId === ref.blockId) {
        const hit = intersectSpan(ref.start, ref.end, r.start, r.end);
        if (hit) cuts.push(hit);
      }
    }
    if (r.scope === 'table' && isTableSourceRef(ref) && isTextSourceRef(ref)) {
      if (
        ref.tableId === r.tableId &&
        ref.rowId === r.rowId &&
        ref.cellId === r.cellId &&
        ref.partId === r.partId
      ) {
        const hit = intersectSpan(ref.start, ref.end, r.start, r.end);
        if (hit) cuts.push(hit);
      }
    }
  }
  return cuts;
}

function rangeIntersectsNodeSafe(range: Range, node: Node): boolean {
  try {
    return range.intersectsNode(node);
  } catch {
    return false;
  }
}

function elementMatchesMappingFilter(el: HTMLElement, options: RichTextSelectionOptions): boolean {
  const mappedState = options.mappedState ?? 'any';
  if (mappedState !== 'any') {
    const isMapped = el.dataset.isMapped === 'true';
    if (mappedState === 'mapped' ? !isMapped : isMapped) {
      return false;
    }
  }

  if (!options.mappingKeys?.size) {
    return true;
  }

  const elementMappingKeys = (el.dataset.mappingKeys ?? '')
    .split('|')
    .map((value) => value.trim())
    .filter(Boolean);

  return elementMappingKeys.some((mappingKey) => options.mappingKeys?.has(mappingKey));
}

/**
 * Character offsets `[localStart, localEnd)` within `el.textContent` for the
 * intersection of `selection` with the text inside `el`.
 */
function getIntersectionCharOffsetsWithinElement(
  el: HTMLElement,
  selection: Range
): [number, number] | null {
  if (!rangeIntersectsNodeSafe(selection, el)) return null;

  if (typeof selection.cloneRange !== 'function') {
    return null;
  }

  const innerStart = document.createRange();
  innerStart.selectNodeContents(el);
  innerStart.collapse(true);

  const selStart = selection.cloneRange();
  selStart.collapse(true);

  let localStart: number;
  if (innerStart.compareBoundaryPoints(Range.START_TO_START, selStart) > 0) {
    localStart = 0;
  } else {
    const pre = document.createRange();
    pre.selectNodeContents(el);
    try {
      pre.setEnd(selection.startContainer, selection.startOffset);
    } catch {
      return null;
    }
    localStart = pre.toString().length;
  }

  const innerEnd = document.createRange();
  innerEnd.selectNodeContents(el);
  innerEnd.collapse(false);

  const selEnd = selection.cloneRange();
  selEnd.collapse(false);

  const textLen = (el.textContent ?? '').length;
  let localEnd: number;
  if (innerEnd.compareBoundaryPoints(Range.END_TO_END, selEnd) > 0) {
    const pre = document.createRange();
    pre.selectNodeContents(el);
    try {
      pre.setEnd(selection.endContainer, selection.endOffset);
    } catch {
      return null;
    }
    localEnd = pre.toString().length;
  } else {
    localEnd = textLen;
  }

  localStart = Math.max(0, Math.min(textLen, localStart));
  localEnd = Math.max(0, Math.min(textLen, localEnd));

  if (localEnd <= localStart) return null;
  return [localStart, localEnd];
}

/**
 * Maps DOM-local intersection to absolute normalized-document indices for this segment.
 */
function getAbsoluteIntersectionForMappedSegment(
  el: HTMLElement,
  selection: Range,
  segStart: number,
  segEnd: number
): [number, number] | null {
  const local = getIntersectionCharOffsetsWithinElement(el, selection);
  if (!local) return null;

  const [localStart, localEnd] = local;
  const absStart = segStart + localStart;
  const absEnd = segStart + localEnd;
  const clampedStart = Math.max(segStart, Math.min(segEnd, absStart));
  const clampedEnd = Math.max(segStart, Math.min(segEnd, absEnd));
  if (clampedEnd <= clampedStart) return null;
  return [clampedStart, clampedEnd];
}

function mergeTextExclusionRanges(ranges: TextExclusionRange[]): TextExclusionRange[] {
  const blockBuckets = new Map<string, [number, number][]>();
  const tableBuckets = new Map<string, [number, number][]>();

  for (const r of ranges) {
    if (r.scope === 'block') {
      const arr = blockBuckets.get(r.blockId) ?? [];
      arr.push([r.start, r.end]);
      blockBuckets.set(r.blockId, arr);
    } else {
      const key = JSON.stringify([r.tableId, r.rowId, r.cellId, r.partId]);
      const arr = tableBuckets.get(key) ?? [];
      arr.push([r.start, r.end]);
      tableBuckets.set(key, arr);
    }
  }

  const out: TextExclusionRange[] = [];
  for (const [blockId, intervals] of blockBuckets) {
    for (const [start, end] of mergeIntervals(intervals)) {
      out.push({ scope: 'block', blockId, start, end });
    }
  }
  for (const [key, intervals] of tableBuckets) {
    const [tableId, rowId, cellId, partId] = JSON.parse(key) as [string, string, string, string];
    for (const [start, end] of mergeIntervals(intervals)) {
      out.push({ scope: 'table', tableId, rowId, cellId, partId, start, end });
    }
  }
  return out;
}

function appendMergedTextRange(
  items: RichTextSelectionItem[],
  range: TextExclusionRange
): RichTextSelectionItem[] {
  const previous = items[items.length - 1];
  if (!previous || previous.kind !== 'text') {
    return [...items, { kind: 'text', range }];
  }

  if (range.scope !== previous.range.scope) {
    return [...items, { kind: 'text', range }];
  }

  if (
    range.scope === 'block' &&
    previous.range.scope === 'block' &&
    range.blockId === previous.range.blockId &&
    range.start <= previous.range.end
  ) {
    return [
      ...items.slice(0, -1),
      {
        kind: 'text',
        range: {
          scope: 'block',
          blockId: range.blockId,
          start: Math.min(previous.range.start, range.start),
          end: Math.max(previous.range.end, range.end),
        },
      },
    ];
  }

  if (
    range.scope === 'table' &&
    previous.range.scope === 'table' &&
    range.tableId === previous.range.tableId &&
    range.rowId === previous.range.rowId &&
    range.cellId === previous.range.cellId &&
    range.partId === previous.range.partId &&
    range.start <= previous.range.end
  ) {
    return [
      ...items.slice(0, -1),
      {
        kind: 'text',
        range: {
          scope: 'table',
          tableId: range.tableId,
          rowId: range.rowId,
          cellId: range.cellId,
          partId: range.partId,
          start: Math.min(previous.range.start, range.start),
          end: Math.max(previous.range.end, range.end),
        },
      },
    ];
  }

  return [...items, { kind: 'text', range }];
}

/**
 * Text from mapped review segments that intersect the selection (DOM order).
 * Omits unmapped text so the exclude modal shows only what maps to fields.
 */
export function collectMappedExclusionPreviewText(
  root: HTMLElement | null,
  selectedRange: Range | null
): string {
  if (!root || !selectedRange) return '';

  const mapped = root.querySelectorAll<HTMLElement>(
    '[data-review-text-segment="true"][data-is-mapped="true"]'
  );
  const pieces: string[] = [];
  mapped.forEach((el) => {
    if (!rangeIntersectsNodeSafe(selectedRange, el)) return;

    const segStart = Number(el.dataset.rangeStart);
    const segEnd = Number(el.dataset.rangeEnd);
    if (!Number.isFinite(segStart) || !Number.isFinite(segEnd) || segStart >= segEnd) return;

    const local = getIntersectionCharOffsetsWithinElement(el, selectedRange);
    if (!local) return;
    const [ls, le] = local;
    pieces.push((el.textContent ?? '').slice(ls, le));
  });
  return pieces.join('');
}

/**
 * Reads mapped review text segments touched by the selection and returns merged
 * character ranges in normalized-document coordinates (per block or table text part).
 */
export function collectTextExclusionRangesFromSelection(
  root: HTMLElement | null,
  selectedRange: Range | null
): TextExclusionRange[] {
  if (!root || !selectedRange) return [];

  const mapped = root.querySelectorAll<HTMLElement>(
    '[data-review-text-segment="true"][data-is-mapped="true"]'
  );
  const raw: TextExclusionRange[] = [];

  mapped.forEach((el) => {
    if (!rangeIntersectsNodeSafe(selectedRange, el)) return;

    const scope = el.dataset.textScope;
    const segStart = Number(el.dataset.rangeStart);
    const segEnd = Number(el.dataset.rangeEnd);
    if (!Number.isFinite(segStart) || !Number.isFinite(segEnd) || segStart >= segEnd) return;

    const abs = getAbsoluteIntersectionForMappedSegment(el, selectedRange, segStart, segEnd);
    if (!abs) return;
    const [start, end] = abs;

    if (scope === 'block' && el.dataset.blockId) {
      raw.push({ scope: 'block', blockId: el.dataset.blockId, start, end });
      return;
    }

    if (
      scope === 'table' &&
      el.dataset.tableId &&
      el.dataset.rowId &&
      el.dataset.cellId &&
      el.dataset.partId
    ) {
      raw.push({
        scope: 'table',
        tableId: el.dataset.tableId,
        rowId: el.dataset.rowId,
        cellId: el.dataset.cellId,
        partId: el.dataset.partId,
        start,
        end,
      });
    }
  });

  return mergeTextExclusionRanges(raw);
}

/**
 * Unmapped review segments touched by the selection → merged absolute ranges (same shape as exclusion).
 */
export function collectTextAssignRangesFromSelection(
  root: HTMLElement | null,
  selectedRange: Range | null
): TextExclusionRange[] {
  if (!root || !selectedRange) return [];

  const unmapped = root.querySelectorAll<HTMLElement>(
    '[data-review-text-segment="true"][data-is-mapped="false"]'
  );
  const raw: TextExclusionRange[] = [];

  unmapped.forEach((el) => {
    if (!rangeIntersectsNodeSafe(selectedRange, el)) return;

    const scope = el.dataset.textScope;
    const segStart = Number(el.dataset.rangeStart);
    const segEnd = Number(el.dataset.rangeEnd);
    if (!Number.isFinite(segStart) || !Number.isFinite(segEnd) || segStart >= segEnd) return;

    const abs = getAbsoluteIntersectionForMappedSegment(el, selectedRange, segStart, segEnd);
    if (!abs) return;
    const [start, end] = abs;

    if (scope === 'block' && el.dataset.blockId) {
      raw.push({ scope: 'block', blockId: el.dataset.blockId, start, end });
      return;
    }

    if (
      scope === 'table' &&
      el.dataset.tableId &&
      el.dataset.rowId &&
      el.dataset.cellId &&
      el.dataset.partId
    ) {
      raw.push({
        scope: 'table',
        tableId: el.dataset.tableId,
        rowId: el.dataset.rowId,
        cellId: el.dataset.cellId,
        partId: el.dataset.partId,
        start,
        end,
      });
    }
  });

  return mergeTextExclusionRanges(raw);
}

function collectRichTextSelectionItems(
  root: HTMLElement | null,
  selectedRange: Range | null,
  options: RichTextSelectionOptions = {}
): RichTextSelectionItem[] {
  if (!root || !selectedRange) return [];

  const elements = root.querySelectorAll<HTMLElement>(
    '[data-review-text-segment="true"], [data-review-image-segment="true"]'
  );

  let items: RichTextSelectionItem[] = [];

  elements.forEach((el) => {
    if (!rangeIntersectsNodeSafe(selectedRange, el) || !elementMatchesMappingFilter(el, options)) {
      return;
    }

    if (el.dataset.reviewTextSegment === 'true') {
      const scope = el.dataset.textScope;
      const segStart = Number(el.dataset.rangeStart);
      const segEnd = Number(el.dataset.rangeEnd);
      if (!Number.isFinite(segStart) || !Number.isFinite(segEnd) || segStart >= segEnd) return;

      const abs = getAbsoluteIntersectionForMappedSegment(el, selectedRange, segStart, segEnd);
      if (!abs) return;
      const [start, end] = abs;

      if (scope === 'block' && el.dataset.blockId) {
        items = appendMergedTextRange(items, {
          scope: 'block',
          blockId: el.dataset.blockId,
          start,
          end,
        });
        return;
      }

      if (
        scope === 'table' &&
        el.dataset.tableId &&
        el.dataset.rowId &&
        el.dataset.cellId &&
        el.dataset.partId
      ) {
        items = appendMergedTextRange(items, {
          scope: 'table',
          tableId: el.dataset.tableId,
          rowId: el.dataset.rowId,
          cellId: el.dataset.cellId,
          partId: el.dataset.partId,
          start,
          end,
        });
      }
      return;
    }

    if (el.dataset.reviewImageSegment !== 'true') {
      return;
    }

    const imageScope = el.dataset.imageScope;
    if (imageScope === 'block' && el.dataset.blockId && el.dataset.imageId) {
      items.push({
        kind: 'image',
        sourceRef: {
          type: 'image',
          blockId: el.dataset.blockId,
          imageId: el.dataset.imageId,
        },
      });
      return;
    }

    if (
      imageScope === 'table' &&
      el.dataset.tableId &&
      el.dataset.rowId &&
      el.dataset.cellId &&
      el.dataset.partId &&
      el.dataset.imageId
    ) {
      items.push({
        kind: 'image',
        sourceRef: {
          type: 'tableImage',
          tableId: el.dataset.tableId,
          rowId: el.dataset.rowId,
          cellId: el.dataset.cellId,
          partId: el.dataset.partId,
          imageId: el.dataset.imageId,
        },
      });
    }
  });

  return items;
}

function findContentBlockById(
  document: NormalizedDocument,
  blockId: string
): NormalizedDocumentContentBlock | undefined {
  for (const block of document.contentBlocks) {
    if (block.type !== 'tab' && block.id === blockId) {
      return block;
    }
  }
  return undefined;
}

function findTableTextPart(
  document: NormalizedDocument,
  tableId: string,
  rowId: string,
  cellId: string,
  partId: string
): { flattenedTextRuns: NormalizedDocumentFlattenedRun[] } | undefined {
  const table = document.tables.find((t) => t.id === tableId);
  const row = table?.rows.find((r) => r.id === rowId);
  const cell = row?.cells.find((c) => c.id === cellId);
  const part = cell?.parts.find((p) => p.id === partId);
  if (!part || part.type !== 'text') return undefined;
  return part;
}

function buildRichTextTextSourceRef(
  document: NormalizedDocument,
  range: TextExclusionRange
): TextRangeSourceRef | null {
  if (range.scope === 'block') {
    const block = findContentBlockById(document, range.blockId);
    if (!block?.flattenedTextRuns?.length || block.type === 'image') return null;

    const flattenedRuns = clipFlattenedRuns(block.flattenedTextRuns, range.start, range.end);
    if (!flattenedRuns.length) return null;

    const base = {
      blockId: range.blockId,
      start: range.start,
      end: range.end,
      flattenedRuns,
    };

    if (block.type === 'heading') {
      return {
        type: 'heading',
        ...base,
        ...(block.headingLevel !== undefined ? { headingLevel: block.headingLevel } : {}),
      };
    }

    if (block.type === 'listItem') {
      return {
        type: 'listItem',
        ...base,
        ...(block.bullet !== undefined ? { bullet: block.bullet } : {}),
      };
    }

    return {
      type: 'paragraph',
      ...base,
    };
  }

  const part = findTableTextPart(document, range.tableId, range.rowId, range.cellId, range.partId);
  if (!part?.flattenedTextRuns?.length) return null;

  const flattenedRuns = clipFlattenedRuns(part.flattenedTextRuns, range.start, range.end);
  if (!flattenedRuns.length) return null;

  return {
    type: 'tableText',
    tableId: range.tableId,
    rowId: range.rowId,
    cellId: range.cellId,
    partId: range.partId,
    start: range.start,
    end: range.end,
    flattenedRuns,
  };
}

export function collectRichTextSourceRefsFromSelection(
  root: HTMLElement | null,
  selectedRange: Range | null,
  document: NormalizedDocument,
  options: RichTextSelectionOptions = {}
): SourceRef[] {
  const items = collectRichTextSelectionItems(root, selectedRange, options);

  return items.flatMap<SourceRef>((item) => {
    if (item.kind === 'image') {
      return [item.sourceRef];
    }

    const sourceRef = buildRichTextTextSourceRef(document, item.range);
    return sourceRef ? [sourceRef] : [];
  });
}

export function selectionIncludesTableContent(
  root: HTMLElement | null,
  selectedRange: Range | null
): boolean {
  if (!root || !selectedRange) return false;

  const elements = root.querySelectorAll<HTMLElement>(
    '[data-review-text-segment="true"][data-text-scope="table"], [data-review-image-segment="true"][data-image-scope="table"]'
  );

  return Array.from(elements).some((el) => rangeIntersectsNodeSafe(selectedRange, el));
}

/**
 * Builds indexed text refs for assign (same discriminant vocabulary as agents-api
 * `indexedEntryBlockGraph`) so mapping-review resume passes Zod.
 */
export function buildTextSourceRefsForAssignRanges(
  document: NormalizedDocument,
  ranges: TextExclusionRange[]
): TextRangeSourceRef[] {
  const out: TextRangeSourceRef[] = [];

  for (const r of ranges) {
    if (r.scope === 'block') {
      const block = findContentBlockById(document, r.blockId);
      if (!block?.flattenedTextRuns?.length || block.type === 'image') continue;
      const flattenedRuns = clipFlattenedRuns(block.flattenedTextRuns, r.start, r.end);
      if (!flattenedRuns.length) continue;

      const base = { blockId: r.blockId, start: r.start, end: r.end, flattenedRuns };

      if (block.type === 'heading') {
        out.push({
          type: 'heading',
          ...base,
          ...(block.headingLevel !== undefined && { headingLevel: block.headingLevel }),
        });
        continue;
      }
      if (block.type === 'listItem') {
        out.push({
          type: 'listItem',
          ...base,
          ...(block.bullet !== undefined && { bullet: block.bullet }),
        });
        continue;
      }

      out.push({ type: 'paragraph', ...base });
      continue;
    }

    const part = findTableTextPart(document, r.tableId, r.rowId, r.cellId, r.partId);
    if (!part?.flattenedTextRuns?.length) continue;
    const flattenedRuns = clipFlattenedRuns(part.flattenedTextRuns, r.start, r.end);
    if (!flattenedRuns.length) continue;
    out.push({
      type: 'tableText',
      tableId: r.tableId,
      rowId: r.rowId,
      cellId: r.cellId,
      partId: r.partId,
      start: r.start,
      end: r.end,
      flattenedRuns,
    });
  }

  return out;
}

export type TextAssignTarget = { entryIndex: number; fieldId: string; fieldType: string };

/**
 * Appends new text source refs from unmapped document ranges to each target field (no removal from any field).
 */
export function applyTextAssignToEntryBlockGraph(
  graph: EntryBlockGraph,
  document: NormalizedDocument,
  ranges: TextExclusionRange[],
  targets: ReadonlyArray<TextAssignTarget>
): EntryBlockGraph {
  if (!ranges.length || !targets.length) return graph;

  const movedRefs = buildTextSourceRefsForAssignRanges(document, mergeTextExclusionRanges(ranges));
  if (!movedRefs.length) return graph;

  const seen = new Set<string>();
  const dedupedTargets = targets.filter((t) => {
    const k = `${t.entryIndex}|${t.fieldId}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (!dedupedTargets.length) return graph;

  let next = graph;
  for (const t of dedupedTargets) {
    next = appendTextRefsToFieldMapping(next, t.entryIndex, t.fieldId, t.fieldType, movedRefs);
  }
  return next;
}

/**
 * Returns a new graph where the chosen field's matching text source ref(s) are split/shrunk
 * so excluded character ranges are no longer part of any source ref (for CMA resume).
 */
export function applyTextExclusionToEntryBlockGraph(
  graph: EntryBlockGraph,
  location: EditLocationOption,
  pendingRanges: TextExclusionRange[]
): EntryBlockGraph {
  if (!pendingRanges.length) return graph;
  const locationSourceRefKeys = getLocationSourceRefKeys(location);

  const nextEntries = graph.entries.map((entry, idx) => {
    if (idx !== location.entryIndex) return entry;

    return {
      ...entry,
      fieldMappings: entry.fieldMappings
        .map((fm) => {
          if (fm.fieldId !== location.fieldId) return fm;

          const nextRefs = fm.sourceRefs.flatMap((sr) => {
            if (!locationSourceRefKeys.has(buildSourceRefKey(sr))) return [sr];
            if (!isTextSourceRef(sr)) return [sr];

            const cuts = rangesOverlappingTextSourceRef(sr, pendingRanges);
            if (!cuts.length) return [sr];

            const remaining = subtractIntervalsFromSpan(sr.start, sr.end, cuts);
            const pieces = buildTextRefsFromSpans(sr, remaining).filter((r) => r.start < r.end);
            return pieces.length ? pieces : [];
          });

          return nextRefs.length ? { ...fm, sourceRefs: nextRefs } : null;
        })
        .filter((fm): fm is NonNullable<typeof fm> => fm !== null),
    };
  });

  return { ...graph, entries: nextEntries };
}

function cloneTextRangeSourceRef(ref: TextRangeSourceRef): TextRangeSourceRef {
  return {
    ...ref,
    flattenedRuns: ref.flattenedRuns.map((run) => ({ ...run })),
  };
}

function cloneSourceRef(ref: SourceRef): SourceRef {
  if (isTextSourceRef(ref)) {
    return cloneTextRangeSourceRef(ref);
  }

  return { ...ref } as SourceRef;
}

function getLocationSourceRefs(location: EditLocationOption): SourceRef[] {
  return location.sourceRefs?.length ? location.sourceRefs : [location.sourceRef];
}

function getLocationSourceRefKeys(location: EditLocationOption): Set<string> {
  return new Set(getLocationSourceRefs(location).map((sourceRef) => buildSourceRefKey(sourceRef)));
}

function appendTextRefsToFieldMapping(
  graph: EntryBlockGraph,
  entryIndex: number,
  fieldId: string,
  fieldType: string,
  refs: TextRangeSourceRef[]
): EntryBlockGraph {
  if (!refs.length) return graph;

  return {
    ...graph,
    entries: graph.entries.map((entry, idx) => {
      if (idx !== entryIndex) return entry;

      const fmIdx = entry.fieldMappings.findIndex((fm) => fm.fieldId === fieldId);
      if (fmIdx === -1) {
        return {
          ...entry,
          fieldMappings: [
            ...entry.fieldMappings,
            { fieldId, fieldType, sourceRefs: refs.map(cloneTextRangeSourceRef), confidence: 1 },
          ],
        };
      }

      return {
        ...entry,
        fieldMappings: entry.fieldMappings.map((fm, j) =>
          j === fmIdx
            ? { ...fm, sourceRefs: [...fm.sourceRefs, ...refs.map(cloneTextRangeSourceRef)] }
            : fm
        ),
      };
    }),
  };
}

function appendSourceRefsToFieldMapping(
  graph: EntryBlockGraph,
  document: NormalizedDocument,
  entryIndex: number,
  fieldId: string,
  fieldType: string,
  refs: SourceRef[]
): EntryBlockGraph {
  if (!refs.length) return graph;

  return {
    ...graph,
    entries: graph.entries.map((entry, idx) => {
      if (idx !== entryIndex) return entry;

      const fmIdx = entry.fieldMappings.findIndex((fm) => fm.fieldId === fieldId);
      if (fmIdx === -1) {
        return {
          ...entry,
          fieldMappings: [
            ...entry.fieldMappings,
            {
              fieldId,
              fieldType,
              sourceRefs: normalizeRichTextSourceRefs(document, refs),
              confidence: 1,
            },
          ],
        };
      }

      return {
        ...entry,
        fieldMappings: entry.fieldMappings.map((fm, j) =>
          j === fmIdx
            ? {
                ...fm,
                sourceRefs: normalizeRichTextSourceRefs(document, [
                  ...fm.sourceRefs,
                  ...refs.map(cloneSourceRef),
                ]),
              }
            : fm
        ),
      };
    }),
  };
}

function removeSourceRefsFromFieldMapping(
  fieldMapping: FieldMapping,
  sourceRefKeys: Set<string>
): FieldMapping {
  return {
    ...fieldMapping,
    sourceRefs: fieldMapping.sourceRefs.filter(
      (sourceRef) => !sourceRefKeys.has(buildSourceRefKey(sourceRef))
    ),
  };
}

export function applyRichTextAssignToEntryBlockGraph(
  graph: EntryBlockGraph,
  document: NormalizedDocument,
  refs: SourceRef[],
  targets: ReadonlyArray<TextAssignTarget>
): EntryBlockGraph {
  if (!refs.length || !targets.length) return graph;

  const seen = new Set<string>();
  const dedupedTargets = targets.filter((target) => {
    const key = `${target.entryIndex}|${target.fieldId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let next = graph;
  for (const target of dedupedTargets) {
    next = appendSourceRefsToFieldMapping(
      next,
      document,
      target.entryIndex,
      target.fieldId,
      target.fieldType,
      refs
    );
  }

  return next;
}

export function applyRichTextReassignToEntryBlockGraph(
  graph: EntryBlockGraph,
  document: NormalizedDocument,
  from: EditLocationOption,
  refs: SourceRef[],
  targets: ReadonlyArray<TextAssignTarget>
): EntryBlockGraph {
  if (!refs.length || !targets.length) return graph;

  const seen = new Set<string>();
  const dedupedTargets = targets.filter((target) => {
    if (target.entryIndex === from.entryIndex && target.fieldId === from.fieldId) return false;
    const key = `${target.entryIndex}|${target.fieldId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (!dedupedTargets.length) return graph;

  const textRanges = refs.flatMap<TextExclusionRange>((ref) => {
    if (!isTextSourceRef(ref)) return [];
    if (isTableTextSourceRef(ref)) {
      return [
        {
          scope: 'table' as const,
          tableId: ref.tableId,
          rowId: ref.rowId,
          cellId: ref.cellId,
          partId: ref.partId,
          start: ref.start,
          end: ref.end,
        },
      ];
    }

    return [{ scope: 'block' as const, blockId: ref.blockId, start: ref.start, end: ref.end }];
  });

  let nextGraph =
    textRanges.length > 0 ? applyTextExclusionToEntryBlockGraph(graph, from, textRanges) : graph;

  const imageSourceRefKeys = new Set(
    refs
      .filter((ref) => isBlockImageSourceRef(ref) || isTableImageSourceRef(ref))
      .map((sourceRef) => buildSourceRefKey(sourceRef))
  );

  if (imageSourceRefKeys.size > 0) {
    const nextEntries = nextGraph.entries.map((entry, index) => {
      if (index !== from.entryIndex) return entry;

      return {
        ...entry,
        fieldMappings: entry.fieldMappings.map((fieldMapping) =>
          fieldMapping.fieldId === from.fieldId
            ? removeSourceRefsFromFieldMapping(fieldMapping, imageSourceRefKeys)
            : fieldMapping
        ),
      };
    });

    nextGraph = { ...nextGraph, entries: nextEntries };
  }

  return applyRichTextAssignToEntryBlockGraph(nextGraph, document, refs, dedupedTargets);
}

/**
 * Moves selected character ranges from a text `sourceRef` on `from` into one or more target fields.
 * Reuses exclusion-style splitting on the source field, then appends moved slices to each target.
 */
export function applyTextReassignToEntryBlockGraph(
  graph: EntryBlockGraph,
  from: EditLocationOption,
  pendingRanges: TextExclusionRange[],
  targets: ReadonlyArray<{ entryIndex: number; fieldId: string; fieldType: string }>
): EntryBlockGraph {
  if (!targets.length) return graph;
  const seen = new Set<string>();
  const dedupedTargets = targets.filter((t) => {
    if (t.entryIndex === from.entryIndex && t.fieldId === from.fieldId) return false;
    const k = `${t.entryIndex}|${t.fieldId}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (!dedupedTargets.length) return graph;

  const fromEntry = graph.entries[from.entryIndex];
  const fromFm = fromEntry?.fieldMappings.find((fm) => fm.fieldId === from.fieldId);
  const sourceRefKeys = getLocationSourceRefKeys(from);
  const movedRefs =
    fromFm?.sourceRefs.flatMap((sourceRef) => {
      if (!sourceRefKeys.has(buildSourceRefKey(sourceRef)) || !isTextSourceRef(sourceRef)) {
        return [];
      }

      const mergedCuts = mergeIntervals(rangesOverlappingTextSourceRef(sourceRef, pendingRanges));
      if (!mergedCuts.length) {
        return [];
      }

      return buildTextRefsFromSpans(sourceRef, mergedCuts).filter((ref) => ref.start < ref.end);
    }) ?? [];
  if (!movedRefs.length) return graph;

  let next = applyTextExclusionToEntryBlockGraph(graph, from, pendingRanges);

  for (const t of dedupedTargets) {
    next = appendTextRefsToFieldMapping(next, t.entryIndex, t.fieldId, t.fieldType, movedRefs);
  }

  return next;
}

/** When the DOM produced no merged ranges, use the whole mapped text ref span for reassign. */
export function fullSpanTextExclusionRangesForSourceRef(
  sourceRef: SourceRef
): TextExclusionRange[] {
  if (!isTextSourceRef(sourceRef)) return [];
  if (isTableTextSourceRef(sourceRef)) {
    return [
      {
        scope: 'table',
        tableId: sourceRef.tableId,
        rowId: sourceRef.rowId,
        cellId: sourceRef.cellId,
        partId: sourceRef.partId,
        start: sourceRef.start,
        end: sourceRef.end,
      },
    ];
  }
  return [
    { scope: 'block', blockId: sourceRef.blockId, start: sourceRef.start, end: sourceRef.end },
  ];
}

export function fullSpanTextExclusionRangesForLocation(
  location: EditLocationOption
): TextExclusionRange[] {
  const sourceRefs = location.sourceRefs?.length ? location.sourceRefs : [location.sourceRef];
  return sourceRefs.flatMap((sourceRef) => fullSpanTextExclusionRangesForSourceRef(sourceRef));
}

/**
 * Removes the image ref from the chosen field mapping and records it in excludedSourceRefs for UI.
 */
export function applyImageExclusionToEntryBlockGraph(
  graph: EntryBlockGraph,
  location: EditLocationOption,
  imageRef: ImageSourceRef
): EntryBlockGraph {
  const key = buildSourceRefKey(imageRef);

  const nextEntries = graph.entries.map((entry, idx) => {
    if (idx !== location.entryIndex) return entry;

    return {
      ...entry,
      fieldMappings: entry.fieldMappings.flatMap((fm) => {
        if (fm.fieldId !== location.fieldId) return [fm];
        const nextRefs = fm.sourceRefs.filter((sr) => buildSourceRefKey(sr) !== key);
        return nextRefs.length ? [{ ...fm, sourceRefs: nextRefs }] : [];
      }),
    };
  });

  const already = graph.excludedSourceRefs.some((r) => buildSourceRefKey(r) === key);
  return {
    ...graph,
    entries: nextEntries,
    excludedSourceRefs: already
      ? graph.excludedSourceRefs
      : [...graph.excludedSourceRefs, imageRef],
  };
}

function removeImageRefFromFieldMapping(
  entries: EntryBlockGraph['entries'],
  entryIndexToUpdate: number,
  fieldIdToUpdate: string,
  sourceRefKey: string
): EntryBlockGraph['entries'] {
  return entries.map((entry, idx) => {
    if (idx !== entryIndexToUpdate) return entry;

    return {
      ...entry,
      fieldMappings: entry.fieldMappings.map((fm) => {
        if (fm.fieldId !== fieldIdToUpdate) return fm;
        return {
          ...fm,
          sourceRefs: fm.sourceRefs.filter((sr) => buildSourceRefKey(sr) !== sourceRefKey),
        };
      }),
    };
  });
}

export type ImageAssignTarget = { entryIndex: number; fieldId: string; fieldType: string };

function dedupeImageTargets(
  targets: ReadonlyArray<ImageAssignTarget>,
  exclude?: { entryIndex: number; fieldId: string }
): ImageAssignTarget[] {
  const seen = new Set<string>();
  return targets.filter((target) => {
    if (exclude && target.entryIndex === exclude.entryIndex && target.fieldId === exclude.fieldId) {
      return false;
    }
    const key = `${target.entryIndex}|${target.fieldId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function groupImageTargetsByEntry(
  targets: ReadonlyArray<ImageAssignTarget>
): Map<number, ImageAssignTarget[]> {
  return targets.reduce((acc, target) => {
    const entryTargets = acc.get(target.entryIndex) ?? [];
    entryTargets.push(target);
    acc.set(target.entryIndex, entryTargets);
    return acc;
  }, new Map<number, ImageAssignTarget[]>());
}

export function appendImageToTargets(
  graph: EntryBlockGraph,
  imageRef: ImageSourceRef,
  targets: ReadonlyArray<ImageAssignTarget>
): EntryBlockGraph {
  const key = buildSourceRefKey(imageRef);
  const dedupedTargets = dedupeImageTargets(targets);
  if (!dedupedTargets.length) return graph;
  const targetsByEntry = groupImageTargetsByEntry(dedupedTargets);

  const nextEntries = graph.entries.map((entry, entryIndex) => {
    const targetForEntry = targetsByEntry.get(entryIndex) ?? [];
    if (!targetForEntry.length) return entry;

    const targetFieldIds = new Set(targetForEntry.map((target) => target.fieldId));
    const touchedFieldIds = new Set<string>();

    const nextFieldMappings = entry.fieldMappings.map((fieldMapping) => {
      if (!targetFieldIds.has(fieldMapping.fieldId)) {
        return fieldMapping;
      }
      touchedFieldIds.add(fieldMapping.fieldId);
      if (fieldMapping.sourceRefs.some((sourceRef) => buildSourceRefKey(sourceRef) === key)) {
        return fieldMapping;
      }
      return { ...fieldMapping, sourceRefs: [...fieldMapping.sourceRefs, imageRef] };
    });

    const appendedFieldMappings = targetForEntry
      .filter((target) => !touchedFieldIds.has(target.fieldId))
      .map((target) => ({
        fieldId: target.fieldId,
        fieldType: target.fieldType,
        sourceRefs: [imageRef],
        confidence: 1,
      }));

    return { ...entry, fieldMappings: [...nextFieldMappings, ...appendedFieldMappings] };
  });

  return {
    ...graph,
    entries: nextEntries,
    excludedSourceRefs: graph.excludedSourceRefs.filter(
      (sourceRef) => buildSourceRefKey(sourceRef) !== key
    ),
  };
}

/**
 * Moves an image source ref from one mapped field to selected destination fields.
 */
export function applyImageReassignToEntryBlockGraph(
  graph: EntryBlockGraph,
  from: EditLocationOption,
  imageRef: ImageSourceRef,
  targets: ReadonlyArray<ImageAssignTarget>
): EntryBlockGraph {
  const key = buildSourceRefKey(imageRef);
  const dedupedTargets = dedupeImageTargets(targets, {
    entryIndex: from.entryIndex,
    fieldId: from.fieldId,
  });

  if (!dedupedTargets.length) {
    return graph;
  }

  const graphWithoutSource = {
    ...graph,
    entries: removeImageRefFromFieldMapping(graph.entries, from.entryIndex, from.fieldId, key),
  };

  return appendImageToTargets(graphWithoutSource, imageRef, dedupedTargets);
}
