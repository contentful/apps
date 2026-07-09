import { describe, it, expect, vi } from 'vitest';
import {
  detectSpaceDisposition,
  shouldShowExoRows,
  getVisibleEntities,
} from './spaceType';
import { ALL_ENTITIES, EXO_ENTITIES } from '../components/types/config';

const makeCma = (componentTotal: number, contentTotal: number): any => ({
  componentType: {
    getMany: vi.fn().mockResolvedValue({ total: componentTotal, items: [] }),
  },
  contentType: {
    getMany: vi.fn().mockResolvedValue({ total: contentTotal, items: [] }),
  },
});

describe('detectSpaceDisposition', () => {
  it('returns exo when component types exist', async () => {
    expect(await detectSpaceDisposition(makeCma(1, 5))).toBe('exo');
  });

  it('returns classic when no component types but content types exist', async () => {
    expect(await detectSpaceDisposition(makeCma(0, 3))).toBe('classic');
  });

  it('returns empty when neither component nor content types exist', async () => {
    expect(await detectSpaceDisposition(makeCma(0, 0))).toBe('empty');
  });

  it('returns unknown when the probe throws', async () => {
    const cma: any = {
      componentType: { getMany: vi.fn().mockRejectedValue(new Error('boom')) },
      contentType: { getMany: vi.fn() },
    };
    expect(await detectSpaceDisposition(cma)).toBe('unknown');
  });
});

describe('shouldShowExoRows', () => {
  it('shows for exo and empty, hides for classic and unknown', () => {
    expect(shouldShowExoRows('exo')).toBe(true);
    expect(shouldShowExoRows('empty')).toBe(true);
    expect(shouldShowExoRows('classic')).toBe(false);
    expect(shouldShowExoRows('unknown')).toBe(false);
  });
});

describe('getVisibleEntities', () => {
  it('includes ExO entities when shown', () => {
    const visible = getVisibleEntities('exo', ALL_ENTITIES, EXO_ENTITIES);
    expect(visible).toContain('componentTypes');
    expect(visible).toEqual(ALL_ENTITIES);
  });

  it('excludes ExO entities when classic', () => {
    const visible = getVisibleEntities('classic', ALL_ENTITIES, EXO_ENTITIES);
    for (const exo of EXO_ENTITIES) {
      expect(visible).not.toContain(exo);
    }
    expect(visible).toContain('entries');
  });
});
