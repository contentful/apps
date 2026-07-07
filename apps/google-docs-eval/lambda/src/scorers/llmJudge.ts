import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? 'us.anthropic.claude-haiku-4-5-20251001-v1:0';

const client = new BedrockRuntimeClient({ region: 'us-east-1' });

interface JudgeVerdict {
  score: number;
  reason: string;
}

export async function invokeJudge(prompt: string): Promise<JudgeVerdict> {
  const body = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body,
  });

  const response = await client.send(command);
  const raw = JSON.parse(new TextDecoder().decode(response.body)) as {
    content: Array<{ text: string }>;
  };

  const text = raw.content[0]?.text ?? '';

  // Extract JSON from the response, tolerating markdown code fences
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Judge returned non-JSON: ${text}`);

  const verdict = JSON.parse(jsonMatch[0]) as JudgeVerdict;
  return { score: Number(verdict.score), reason: String(verdict.reason) };
}
