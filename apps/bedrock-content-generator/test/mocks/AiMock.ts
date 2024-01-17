import { vi } from "vitest";

function getStubbedGenerator(
  textToStream: string,
): Promise<AsyncGenerator<string, void, unknown> | undefined> {
  // return async () => {
  const streamData = textToStream.split(" ");

  async function* generate() {
    for (let value in streamData) {
      yield value;
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return Promise.resolve(generate());
  // };
}

const AIMock = vi.fn().mockImplementation(() => {
  return {
    streamChatCompletion: vi
      .fn()
      .mockResolvedValue(
        Promise.resolve(getStubbedGenerator("This is a test")),
      ),
    parseStream: vi
      .fn()
      .mockImplementation(
        async (stream: ReadableStreamDefaultReader<Uint8Array>) => {
          if (stream) {
            const { done, value } = await stream.read();
            if (done) {
              return false;
            }

            const decodedValue = new TextDecoder("utf-8").decode(value);

            return decodedValue;
          }
        },
      ),
    sendStopSignal: vi.fn().mockResolvedValue(Promise.resolve()),
  };
});

export default AIMock;
