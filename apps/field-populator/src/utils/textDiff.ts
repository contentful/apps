import { diffWords, Change } from 'diff';

export interface DiffSegment {
  text: string;
  type: 'added' | 'removed' | 'unchanged';
}

/**
 * Computes word-level diff between source and target strings.
 * Returns segments indicating what text was added, removed, or unchanged.
 *
 * @param source - The source text to compare
 * @param target - The target text to compare against
 * @returns Array of segments with type indicating the diff status
 */
export function computeTextDiff(source: string, target: string): DiffSegment[] {
  const changes: Change[] = diffWords(target, source);

  return changes.map((change) => {
    let type: DiffSegment['type'];
    if (change.added) {
      type = 'added';
    } else if (change.removed) {
      type = 'removed';
    } else {
      type = 'unchanged';
    }

    return {
      text: change.value,
      type,
    };
  });
}
