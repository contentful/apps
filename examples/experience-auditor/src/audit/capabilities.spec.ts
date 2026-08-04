import { describe, expect, it } from 'vitest';
import { detectCapabilities } from './capabilities';

describe('detectCapabilities', () => {
  it('reports selection supported when the experience exposes a selection API', () => {
    const experiences: any = {
      experience: { selection: { set: () => {}, highlight: () => {} } },
    };
    expect(detectCapabilities(experiences)).toEqual({ selection: true });
  });

  it('reports selection unsupported when selection is absent', () => {
    const experiences: any = { experience: {} };
    expect(detectCapabilities(experiences)).toEqual({ selection: false });
  });

  it('reports selection unsupported when set/highlight are not functions', () => {
    const experiences: any = { experience: { selection: { set: null, highlight: undefined } } };
    expect(detectCapabilities(experiences)).toEqual({ selection: false });
  });
});
