import type { ScoreResult } from '../types';

export function scoreContextLeak(output: string): ScoreResult {
  if (output.includes('[[CTX]]')) {
    return {
      scorerId: 'context-leak',
      score: 0,
      reason: 'Critical failure: internal [[CTX]] notes leaked into the output.',
    };
  }
  return { scorerId: 'context-leak', score: 1, reason: 'No [[CTX]] tags found in output.' };
}
