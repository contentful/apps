import { useEffect, useState, useCallback } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Note,
  Paragraph,
  Spinner,
  Stack,
  Table,
  Text,
} from '@contentful/f36-components';
import type {
  AgentRun,
  RunMessage,
  ScoreResponse,
  ScoreResult,
  ToolInvocationPart,
} from '../types';

// The agent ID used by the google-docs app — keep in sync with google-docs constants.
const WORKFLOW_AGENT_ID = 'google-docs-workflow-agent';

interface AppInstallationParameters {
  scoringLambdaUrl?: string;
}

function scoreBadgeVariant(score: number): 'positive' | 'warning' | 'negative' | 'secondary' {
  if (score < 0) return 'secondary'; // error / not applicable
  if (score >= 0.8) return 'positive';
  if (score >= 0.5) return 'warning';
  return 'negative';
}

function scoreLabel(score: number): string {
  if (score < 0) return 'Error';
  return `${Math.round(score * 100)}%`;
}

function overallScore(scores: ScoreResult[]): number {
  const valid = scores.filter((s) => s.score >= 0);
  if (valid.length === 0) return 0;
  return valid.reduce((sum, s) => sum + s.score, 0) / valid.length;
}

function extractInput(messages: RunMessage[]): string {
  const userMsg = messages.find((m) => m.role === 'user');
  const textPart = userMsg?.content?.parts?.find((p) => p.type === 'text');
  return textPart && textPart.type === 'text' ? textPart.text : '';
}

function extractOutput(run: AgentRun): string {
  // The final structured output lives in metadata.googleDocPayload on completed runs
  const payload = run.metadata?.googleDocPayload;
  if (payload) return JSON.stringify(payload);

  // Fallback: look for a tool-invocation result in the last assistant message
  // that contains entries/assets JSON
  const messages = run.messages ?? [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== 'assistant') continue;
    const parts = msg.content?.parts ?? [];
    for (const part of parts) {
      if (part.type !== 'tool-invocation') continue;
      const result = (part as ToolInvocationPart).toolInvocation.result;
      if (!result) continue;
      try {
        const parsed = JSON.parse(result) as Record<string, unknown>;
        if (Array.isArray(parsed.entries) || Array.isArray(parsed.assets)) {
          return result;
        }
      } catch {
        // not JSON, skip
      }
    }
  }
  return '';
}

const SCORER_LABELS: Record<string, string> = {
  'json-structure': 'JSON Structure',
  'referential-integrity': 'Referential Integrity',
  'context-leak': 'Context Leak',
  'content-exhaustiveness': 'Content Exhaustiveness',
  'field-level-mapping': 'Field-Level Mapping',
  'multi-type-recognition': 'Multi-Type Recognition',
  'table-handling': 'Table Handling',
};

const EvalPage = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sdk = useSDK<any>();

  const [lambdaUrl, setLambdaUrl] = useState<string>('');
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [runsLoading, setRunsLoading] = useState(true);
  const [runsError, setRunsError] = useState<string | null>(null);

  // runId → scoring state
  const [scoring, setScoring] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, ScoreResponse>>({});
  const [scoringErrors, setScoringErrors] = useState<Record<string, string>>({});

  // Load the Lambda URL from installation parameters (page location uses sdk.parameters.installation)
  useEffect(() => {
    const params = sdk.parameters?.installation as AppInstallationParameters | undefined;
    setLambdaUrl(params?.scoringLambdaUrl ?? '');
  }, [sdk]);

  // Fetch completed runs for the google-docs workflow agent
  useEffect(() => {
    const spaceId = sdk.ids.space as string;
    const environmentId = sdk.ids.environment as string;

    sdk.cma.agentRun
      .getMany({
        spaceId,
        environmentId,
        query: { agentId: WORKFLOW_AGENT_ID, 'sys.status': 'COMPLETED', limit: 20 },
      } as Parameters<typeof sdk.cma.agentRun.getMany>[0])
      .then((res: unknown) => {
        const items = (res as { items: AgentRun[] }).items ?? [];
        setRuns(items);
        setRunsLoading(false);
      })
      .catch((err: Error) => {
        setRunsError(err.message ?? 'Failed to load runs.');
        setRunsLoading(false);
      });
  }, [sdk]);

  const handleScore = useCallback(
    async (run: AgentRun) => {
      const runId = run.sys.id;

      if (!lambdaUrl) {
        setScoringErrors((prev) => ({
          ...prev,
          [runId]: 'No scoring Lambda URL configured. Go to App Configuration to set it.',
        }));
        return;
      }

      setScoring((prev) => ({ ...prev, [runId]: true }));
      setScoringErrors((prev) => {
        const next = { ...prev };
        delete next[runId];
        return next;
      });

      try {
        // Fetch full run (messages + metadata) if not already loaded
        let fullRun = run;
        if (!run.messages || run.messages.length === 0) {
          fullRun = (await sdk.cma.agentRun.get({
            spaceId: sdk.ids.space as string,
            environmentId: sdk.ids.environment as string,
            runId,
          })) as unknown as AgentRun;
        }

        const input = extractInput(fullRun.messages ?? []);
        const output = extractOutput(fullRun);

        if (!output) {
          throw new Error(
            'No output payload found on this run. Only COMPLETED runs can be scored.'
          );
        }

        const response = await fetch(`${lambdaUrl}/score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ runId, input, output }),
        });

        if (!response.ok) {
          throw new Error(`Lambda responded with ${response.status}`);
        }

        const data = (await response.json()) as ScoreResponse;
        setResults((prev) => ({ ...prev, [runId]: data }));
      } catch (err) {
        setScoringErrors((prev) => ({
          ...prev,
          [runId]: err instanceof Error ? err.message : String(err),
        }));
      } finally {
        setScoring((prev) => {
          const next = { ...prev };
          delete next[runId];
          return next;
        });
      }
    },
    [sdk, lambdaUrl]
  );

  return (
    <Box padding="spacingL">
      <Heading>Google Docs Agent Eval</Heading>
      <Paragraph>
        Lists the 20 most recent completed Google Docs workflow runs in this space. Click{' '}
        <strong>Score</strong> to run all 7 eval scorers against a run via the configured Lambda.
      </Paragraph>

      {!lambdaUrl && (
        <Note variant="warning" style={{ marginBottom: 16 }}>
          No scoring Lambda URL is configured. Open <strong>App Configuration</strong> and enter the
          Lambda URL.
        </Note>
      )}

      {runsLoading && (
        <Flex alignItems="center" gap="spacingS">
          <Spinner />
          <Text>Loading runs…</Text>
        </Flex>
      )}

      {runsError && <Note variant="negative">{runsError}</Note>}

      {!runsLoading && !runsError && runs.length === 0 && (
        <Note variant="neutral">
          No completed Google Docs agent runs found in this space/environment.
        </Note>
      )}

      {runs.map((run) => {
        const runId = run.sys.id;
        const result = results[runId];
        const isScoring = scoring[runId] ?? false;
        const error = scoringErrors[runId];

        return (
          <Box
            key={runId}
            padding="spacingM"
            marginBottom="spacingM"
            style={{ border: '1px solid #e3e3e3', borderRadius: 6 }}>
            <Flex justifyContent="space-between" alignItems="flex-start" marginBottom="spacingS">
              <Stack flexDirection="column" spacing="spacing2Xs">
                <Text fontWeight="fontWeightMedium" fontColor="gray900">
                  Run {runId}
                </Text>
                <Text fontColor="gray500" fontSize="fontSizeS">
                  {new Date(run.sys.createdAt).toLocaleString()}
                </Text>
              </Stack>

              <Flex alignItems="center" gap="spacingS">
                {result && (
                  <Badge variant={scoreBadgeVariant(overallScore(result.scores))}>
                    Overall: {scoreLabel(overallScore(result.scores))}
                  </Badge>
                )}
                <Button
                  variant="secondary"
                  size="small"
                  isLoading={isScoring}
                  isDisabled={isScoring}
                  onClick={() => handleScore(run)}>
                  {result ? 'Re-score' : 'Score'}
                </Button>
              </Flex>
            </Flex>

            {error && (
              <Note variant="negative" style={{ marginBottom: 8 }}>
                {error}
              </Note>
            )}

            {result && (
              <Table>
                <Table.Head>
                  <Table.Row>
                    <Table.Cell>Scorer</Table.Cell>
                    <Table.Cell>Score</Table.Cell>
                    <Table.Cell>Reason</Table.Cell>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {result.scores.map((s) => (
                    <Table.Row key={s.scorerId}>
                      <Table.Cell>
                        <Text fontWeight="fontWeightMedium">
                          {SCORER_LABELS[s.scorerId] ?? s.scorerId}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge variant={scoreBadgeVariant(s.score)}>{scoreLabel(s.score)}</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Text fontColor="gray700">{s.reason}</Text>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default EvalPage;
