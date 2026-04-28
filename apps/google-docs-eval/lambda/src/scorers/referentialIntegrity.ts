import type { ScoreResult } from '../types';

type AnyObject = Record<string, unknown>;

export function scoreReferentialIntegrity(output: string): ScoreResult {
  let payload: { entries?: AnyObject[]; assets?: AnyObject[] };

  try {
    payload = JSON.parse(output) as typeof payload;
  } catch {
    return { scorerId: 'referential-integrity', score: 0, reason: 'Cannot parse output as JSON.' };
  }

  const validIds = new Set<string>();
  const brokenLinks: string[] = [];

  const collectIds = (items: AnyObject[] = []) => {
    for (const item of items) {
      const id = (item?.sys as AnyObject)?.id ?? item?.tempId;
      if (typeof id === 'string') validIds.add(id);
    }
  };

  collectIds(payload.entries ?? []);
  collectIds(payload.assets ?? []);

  if (validIds.size === 0) {
    return {
      scorerId: 'referential-integrity',
      score: 1,
      reason: 'No entries or assets to check.',
    };
  }

  const findLinks = (obj: unknown, entryId: string, path: string) => {
    if (!obj || typeof obj !== 'object') return;
    const o = obj as AnyObject;
    if (
      o.sys &&
      (o.sys as AnyObject).type === 'Link' &&
      typeof (o.sys as AnyObject).id === 'string'
    ) {
      const linkedId = (o.sys as AnyObject).id as string;
      if (!validIds.has(linkedId)) {
        brokenLinks.push(`Entry [${entryId}] broken link at '${path}' → missing id: ${linkedId}`);
      }
      return;
    }
    if (o.type === 'Link' && typeof o.tempId === 'string') {
      if (!validIds.has(o.tempId)) {
        brokenLinks.push(
          `Entry [${entryId}] broken link at '${path}' → missing tempId: ${o.tempId}`
        );
      }
      return;
    }
    for (const [key, val] of Object.entries(o)) {
      if (Array.isArray(val)) {
        val.forEach((v, i) => findLinks(v, entryId, `${path}.${key}[${i}]`));
      } else {
        findLinks(val, entryId, `${path}.${key}`);
      }
    }
  };

  for (const entry of payload.entries ?? []) {
    const id = String((entry?.sys as AnyObject)?.id ?? entry?.tempId ?? 'unknown');
    findLinks(entry, id, 'root');
  }

  if (brokenLinks.length === 0) {
    return {
      scorerId: 'referential-integrity',
      score: 1,
      reason: 'All references resolve to valid IDs.',
    };
  }

  const score = Math.max(0, 1 - brokenLinks.length / validIds.size);
  return {
    scorerId: 'referential-integrity',
    score: Math.round(score * 100) / 100,
    reason: `${brokenLinks.length} broken link(s): ${brokenLinks.slice(0, 3).join('; ')}${
      brokenLinks.length > 3 ? ` …and ${brokenLinks.length - 3} more` : ''
    }.`,
  };
}
