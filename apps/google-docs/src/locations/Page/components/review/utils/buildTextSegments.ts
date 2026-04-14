import type { NormalizedDocumentFlattenedRun, SourceRef, TextSourceRef } from '@types';
import { isTextSourceRef } from '@types';

export type TextSegment = {
  text: string;
  styles?: NormalizedDocumentFlattenedRun['styles'];
  highlighted: boolean;
  mappingKeys: string[];
};

export function buildTextSegments(
  flattenedRuns: NormalizedDocumentFlattenedRun[],
  usage: Array<{ sourceRef: SourceRef; mappingKey: string }>
): TextSegment[] {
  if (!flattenedRuns.length) return [];

  const textUsage = usage.filter(
    (usageItem): usageItem is { sourceRef: TextSourceRef; mappingKey: string } =>
      isTextSourceRef(usageItem.sourceRef)
  );

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

  return sortedBoundaries.flatMap((start, index) => {
    const end = sortedBoundaries[index + 1];
    if (end === undefined || start === end) return [];

    const run = flattenedRuns.find((candidate) => start >= candidate.start && end <= candidate.end);
    if (!run) return [];

    const text = run.text.slice(start - run.start, end - run.start);
    if (!text) return [];

    const mappingKeys = textUsage
      .filter(({ sourceRef }) => start >= sourceRef.start && end <= sourceRef.end)
      .map(({ mappingKey }) => mappingKey);

    return [{ text, styles: run.styles, highlighted: mappingKeys.length > 0, mappingKeys }];
  });
}
