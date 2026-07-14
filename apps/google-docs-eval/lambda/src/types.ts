export interface ScoreRequest {
  runId: string;
  // Plain text of the user's prompt sent to the agent
  input: string;
  // JSON string of the agent's final output ({ entries, assets, referenceGraph })
  output: string;
}

export interface ScoreResult {
  scorerId: string;
  score: number;
  reason: string;
}

export interface ScoreResponse {
  runId: string;
  scores: ScoreResult[];
}
