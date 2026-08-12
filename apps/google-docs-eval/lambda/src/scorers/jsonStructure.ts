import type { ScoreResult } from '../types';

export function scoreJsonStructure(output: string): ScoreResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(output);
  } catch {
    return {
      scorerId: 'json-structure',
      score: 0,
      reason: 'Critical failure: output is not valid JSON.',
    };
  }

  const obj = parsed as Record<string, unknown>;
  const hasEntries = Array.isArray(obj?.entries);
  const hasAssets = Array.isArray(obj?.assets);

  if (hasEntries && hasAssets) {
    const entryCount = (obj.entries as unknown[]).length;
    const assetCount = (obj.assets as unknown[]).length;
    return {
      scorerId: 'json-structure',
      score: 1,
      reason: `Valid JSON with ${entryCount} entries and ${assetCount} assets.`,
    };
  }

  if (hasEntries) {
    return {
      scorerId: 'json-structure',
      score: 0.5,
      reason: 'Valid JSON but missing "assets" array.',
    };
  }
  if (hasAssets) {
    return {
      scorerId: 'json-structure',
      score: 0.5,
      reason: 'Valid JSON but missing "entries" array.',
    };
  }

  return {
    scorerId: 'json-structure',
    score: 0,
    reason: 'Valid JSON but missing both "entries" and "assets" arrays.',
  };
}
