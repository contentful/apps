import { diffWords, Change } from 'diff';

export interface DiffSegment {
  text: string;
  type: DiffType;
}

export enum DiffType {
  Added = 'added',
  Removed = 'removed',
  Unchanged = 'unchanged',
}

export function computeTextDiff(source: string, target: string): DiffSegment[] {
  const changes: Change[] = diffWords(source, target);

  return changes.map((change) => {
    let type: DiffSegment['type'];
    if (change.added) {
      type = DiffType.Added;
    } else if (change.removed) {
      type = DiffType.Removed;
    } else {
      type = DiffType.Unchanged;
    }

    return {
      text: change.value,
      type,
    };
  });
}
