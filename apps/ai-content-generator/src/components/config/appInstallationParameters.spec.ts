import { describe, expect, it } from 'vitest';
import { ProfileFields, toProfileType } from './appInstallationParameters';

describe('toProfileType', () => {
  it('reads flat top-level brand-profile fields (new schema)', () => {
    const profile = toProfileType({
      model: 'gpt-4',
      profile: 'Acme Corp',
      values: 'quality',
      tone: 'friendly',
      exclude: 'jargon',
      include: 'benefits',
      audience: 'developers',
      additional: 'be concise',
    });

    expect(profile).toEqual({
      [ProfileFields.PROFILE]: 'Acme Corp',
      [ProfileFields.VALUES]: 'quality',
      [ProfileFields.TONE]: 'friendly',
      [ProfileFields.EXCLUDE]: 'jargon',
      [ProfileFields.INCLUDE]: 'benefits',
      [ProfileFields.AUDIENCE]: 'developers',
      [ProfileFields.ADDITIONAL]: 'be concise',
    });
  });

  it('falls back to legacy nested brandProfile for un-migrated installs', () => {
    const profile = toProfileType({
      model: 'gpt-4',
      profile: 'Acme Corp',
      brandProfile: {
        values: 'quality',
        tone: 'friendly',
        exclude: 'jargon',
        include: 'benefits',
        audience: 'developers',
        additional: 'be concise',
      },
    });

    expect(profile).toEqual({
      [ProfileFields.PROFILE]: 'Acme Corp',
      [ProfileFields.VALUES]: 'quality',
      [ProfileFields.TONE]: 'friendly',
      [ProfileFields.EXCLUDE]: 'jargon',
      [ProfileFields.INCLUDE]: 'benefits',
      [ProfileFields.AUDIENCE]: 'developers',
      [ProfileFields.ADDITIONAL]: 'be concise',
    });
  });

  it('prefers flat fields over nested when both are present (mid-migration)', () => {
    const profile = toProfileType({
      model: 'gpt-4',
      profile: 'Acme Corp',
      tone: 'flat tone',
      brandProfile: {
        tone: 'nested tone',
        values: 'nested values',
      },
    });

    expect(profile[ProfileFields.TONE]).toBe('flat tone');
    // Field only present on the nested shape still resolves via fallback.
    expect(profile[ProfileFields.VALUES]).toBe('nested values');
  });

  it('returns undefined for missing fields on either shape', () => {
    const profile = toProfileType({ model: 'gpt-4' });

    expect(profile[ProfileFields.VALUES]).toBeUndefined();
    expect(profile[ProfileFields.TONE]).toBeUndefined();
    expect(profile[ProfileFields.PROFILE]).toBeUndefined();
  });
});
