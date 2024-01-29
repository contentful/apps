import { featuredModels } from '@configs/aws/featuredModels';
import { BedrockClientMock, BedrockRuntimeClientMock } from '@test/mocks';
import { describe, expect, it, vi } from 'vitest';
import AI from '.';

vi.mock('@aws-sdk/client-bedrock', async (importOriginal) => {
  return {
    ...((await importOriginal()) as object),
    BedrockClient: BedrockClientMock,
  };
});
vi.mock('@aws-sdk/client-bedrock-runtime', async (importOriginal) => {
  return {
    ...((await importOriginal()) as object),
    BedrockRuntimeClient: BedrockRuntimeClientMock,
  };
});

describe('AI', () => {
  it('should generate response', async () => {
    const ai = new AI('', '', '', featuredModels[0]);

    const stream = await ai.streamChatCompletion('', '');

    let text = '';

    for await (const streamOutput of stream!) {
      text += streamOutput;
      text += ' ';
    }
    expect(text).toBe('This is a test ');
  });
});
