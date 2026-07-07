import type { ScoreRequest, ScoreResponse, ScoreResult } from './types';
import { scoreJsonStructure } from './scorers/jsonStructure';
import { scoreReferentialIntegrity } from './scorers/referentialIntegrity';
import { scoreContextLeak } from './scorers/contextLeak';
import { scoreContentExhaustiveness } from './scorers/contentExhaustiveness';
import { scoreFieldLevelMapping } from './scorers/fieldLevelMapping';
import { scoreMultiTypeRecognition } from './scorers/multiTypeRecognition';
import { scoreTableHandling } from './scorers/tableHandling';

export async function score(body: ScoreRequest): Promise<ScoreResponse> {
  const { runId, input, output } = body;

  // Deterministic scorers run synchronously
  const deterministicResults: ScoreResult[] = [
    scoreJsonStructure(output),
    scoreReferentialIntegrity(output),
    scoreContextLeak(output),
  ];

  // LLM-judge scorers run in parallel
  const llmResults = await Promise.all([
    scoreContentExhaustiveness(input, output),
    scoreFieldLevelMapping(input, output),
    scoreMultiTypeRecognition(input, output),
    scoreTableHandling(input, output),
  ]);

  return { runId, scores: [...deterministicResults, ...llmResults] };
}
