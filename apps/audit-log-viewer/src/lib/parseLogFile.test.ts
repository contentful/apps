// @vitest-environment node
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { parseLogFile } from './parseLogFile';

const enc = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer;
const gz = (s: string) => {
  const b = gzipSync(Buffer.from(s));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
};

describe('parseLogFile', () => {
  it('parses a JSON array', async () => {
    expect(await parseLogFile(enc('[{"a":1},{"a":2}]'))).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it('wraps a single JSON object in an array', async () => {
    expect(await parseLogFile(enc('{"a":1}'))).toEqual([{ a: 1 }]);
  });

  it('parses NDJSON, skipping blank and malformed lines', async () => {
    expect(await parseLogFile(enc('{"a":1}\n\nnot-json\n{"a":2}\n'))).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it('transparently gunzips (magic-byte detection)', async () => {
    expect(await parseLogFile(gz('{"a":1}\n{"a":2}'))).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it('returns [] for an empty file', async () => {
    expect(await parseLogFile(enc(''))).toEqual([]);
  });
});
