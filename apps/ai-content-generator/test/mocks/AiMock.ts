import { vi } from 'vitest';

const getStubbedReader = (
  textToStream: string
): ReadableStreamDefaultReader<Uint8Array> & { streamData: string[] } => {
  return {
    streamData: textToStream.split(' '),
    read() {
      if (this.streamData.length === 0) {
        return Promise.resolve({ done: true, value: undefined });
      }

      //test adding comment

      const value = new TextEncoder().encode(this.streamData.shift());

      return new Promise((resolve) => {
        setTimeout(
          () => {
            resolve({ done: false, value });
          },
          Math.floor(Math.random() * 1000)
        );
      });
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    cancel(reason: unknown) {
      return new Promise((resolve) => {
        this.streamData = [];
        resolve(undefined);
      });
    },
    closed: Promise.resolve(undefined),
    releaseLock() {},
  };
};

const AIMock = vi.fn().mockImplementation(() => {
  return {
    streamChatCompletion: vi
      .fn()
      .mockResolvedValue(Promise.resolve(getStubbedReader('This is a test'))),
    parseStream: vi
      .fn()
      .mockImplementation(async (stream: ReadableStreamDefaultReader<Uint8Array>) => {
        if (stream) {
          const { done, value } = await stream.read();
          if (done) {
            return false;
          }

          const decodedValue = new TextDecoder('utf-8').decode(value);

          return decodedValue;
        }
      }),
    sendStopSignal: vi.fn().mockResolvedValue(Promise.resolve()),
  };
});

export default AIMock;
