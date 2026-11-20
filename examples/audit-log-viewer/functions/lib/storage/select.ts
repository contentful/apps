import { coveredDateFromKey } from '../filenames';
import type { LogFileRef } from './types';

export const MAX_FILES = 120;

/**
 * Provider-independent selection: keep audit files whose covered date falls
 * inside [startDate, endDate], newest first, capped at MAX_FILES.
 */
export function selectLogFiles(
  objects: Array<{ key: string; size: number }>,
  startDate: string,
  endDate: string,
): { selected: Array<Omit<LogFileRef, 'url'>>; truncated: boolean } {
  const matches: Array<Omit<LogFileRef, 'url'>> = [];
  for (const obj of objects) {
    const coveredDate = coveredDateFromKey(obj.key);
    if (coveredDate && coveredDate >= startDate && coveredDate <= endDate) {
      matches.push({ key: obj.key, size: obj.size, coveredDate });
    }
  }
  matches.sort((a, b) => b.coveredDate.localeCompare(a.coveredDate));
  const truncated = matches.length > MAX_FILES;
  return { selected: matches.slice(0, MAX_FILES), truncated };
}
