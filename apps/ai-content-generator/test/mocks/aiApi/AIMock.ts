import { vi } from 'vitest';

const getStubbedReader = (): ReadableStreamDefaultReader<Uint8Array> & { streamData: string[] } => {
  return {
    streamData: ['This', 'is', 'a', 'test'],
    read() {
      const returnValue = {
        done: this.streamData.length === 0,
        value: this.streamData.length
          ? new TextEncoder().encode(this.streamData.shift())
          : new TextEncoder().encode(''),
      };

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(returnValue);
        }, 1);
      });
    },
    cancel(reason: any) {
      return Promise.resolve();
    },
    closed: Promise.resolve(undefined),
    releaseLock() {},
  };
};

const AIMock = {
  __esModule: true,
  default: vi.fn().mockImplementation(() => {
    return {
      streamChatCompletion: vi.fn().mockResolvedValue(Promise.resolve(getStubbedReader())),
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
  }),
};

export default AIMock;
