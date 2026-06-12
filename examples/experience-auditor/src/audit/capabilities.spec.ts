import { describe, expect, it } from 'vitest';
import { detectCapabilities } from './capabilities';

describe('detectCapabilities', () => {
  it('reports selection supported when the experience exposes a selection API', () => {
    const exo: any = {
      experience: { selection: { set: () => {}, highlight: () => {} } },
    };
    expect(detectCapabilities(exo)).toEqual({ selection: true });
  });

  it('reports selection unsupported when selection is absent', () => {
    const exo: any = { experience: {} };
    expect(detectCapabilities(exo)).toEqual({ selection: false });
  });

  it('reports selection unsupported when set/highlight are not functions', () => {
    const exo: any = { experience: { selection: { set: null, highlight: undefined } } };
    expect(detectCapabilities(exo)).toEqual({ selection: false });
  });
});
