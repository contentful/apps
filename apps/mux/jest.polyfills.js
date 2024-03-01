/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const { TextDecoder, TextEncoder } = require('node:util');

/* eslint-disable-next-line no-undef */
Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
});
