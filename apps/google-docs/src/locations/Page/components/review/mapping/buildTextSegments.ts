import type { NormalizedDocumentFlattenedRun, TextSourceRef } from '@types';
import { isTextSourceRef } from '@types';
import type { MappingHighlight } from './buildHighlights';
import { getMappingCardKey } from './buildHighlights';

export type TextSegment = {
  start: number;
  end: number;
  text: string;
  styles?: NormalizedDocumentFlattenedRun['styles'];
  highlighted: boolean;
  mappingKeys: string[];
};

export function buildTextSegments(
  flattenedRuns: NormalizedDocumentFlattenedRun[],
  segmentId: string,
  highlights: MappingHighlight[]
): TextSegment[] {
  if (!flattenedRuns.length) return [];

  const textUsage = highlights
    .filter((h): h is MappingHighlight & { sourceRef: TextSourceRef } =>
      isTextSourceRef(h.sourceRef)
    )
    .map((h) => ({ sourceRef: h.sourceRef, mappingKey: getMappingCardKey(segmentId, h) }));

  const boundaries = new Set<number>();
  flattenedRuns.forEach((run) => {
    boundaries.add(run.start);
    boundaries.add(run.end);
  });
  textUsage.forEach(({ sourceRef }) => {
    boundaries.add(sourceRef.start);
    boundaries.add(sourceRef.end);
  });

  const sortedBoundaries = [...boundaries].sort((a, b) => a - b);

  const rawSegments = sortedBoundaries.flatMap((start, index) => {
    const end = sortedBoundaries[index + 1];
    if (end === undefined || start === end) return [];

    const run = flattenedRuns.find((candidate) => start >= candidate.start && end <= candidate.end);
    if (!run) return [];

    const text = run.text.slice(start - run.start, end - run.start);
    if (!text) return [];

    const mappingKeys = textUsage
      .filter(({ sourceRef }) => start >= sourceRef.start && end <= sourceRef.end)
      .map(({ mappingKey }) => mappingKey);

    return [
      { start, end, text, styles: run.styles, highlighted: mappingKeys.length > 0, mappingKeys },
    ];
  });

  return rawSegments.reduce<TextSegment[]>((segments, segment) => {
    const previousSegment = segments[segments.length - 1];
    const sameStyles =
      JSON.stringify(previousSegment?.styles ?? null) === JSON.stringify(segment.styles ?? null);
    const sameMappings =
      JSON.stringify(previousSegment?.mappingKeys ?? []) === JSON.stringify(segment.mappingKeys);

    if (
      previousSegment &&
      previousSegment.end === segment.start &&
      previousSegment.highlighted === segment.highlighted &&
      sameMappings &&
      sameStyles
    ) {
      previousSegment.end = segment.end;
      previousSegment.text += segment.text;
      return segments;
    }

    segments.push({ ...segment, mappingKeys: [...segment.mappingKeys] });
    return segments;
  }, []);
}
