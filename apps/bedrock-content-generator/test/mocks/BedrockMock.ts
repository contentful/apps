import { vi } from 'vitest';

function getStubbedGenerator(textToStream: string): AsyncGenerator<any, void, unknown> | undefined {
  const streamData = textToStream.split(' ').map((input: string) => {
    return new TextEncoder().encode(JSON.stringify({ completion: input }));
  });

  async function* generate() {
    for (const chunk in streamData) {
      yield { chunk: { bytes: streamData[chunk] } };
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return generate();
}

export const BedrockClientMock = vi.fn().mockImplementation(() => {
  return {};
});

export const BedrockRuntimeClientMock = vi.fn().mockImplementation(() => {
  const stream = {
    body: getStubbedGenerator('This is a test'),
  };
  return {
    send: vi.fn().mockResolvedValue(Promise.resolve(stream)),
  };
});
