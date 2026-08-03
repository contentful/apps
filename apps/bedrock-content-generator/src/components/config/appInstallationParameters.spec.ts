import { describe, expect, it } from 'vitest';
import {
  ProfileFields,
  parseEnabledFeatures,
  toProfileType,
} from './appInstallationParameters';
import featureConfig, { AIFeature } from '@configs/features/featureConfig';

const ALL_FEATURES = Object.keys(featureConfig) as AIFeature[];

describe('toProfileType', () => {
  it('reads flat top-level brand-profile fields (new schema)', () => {
    const profile = toProfileType({
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      region: 'us-east-1',
      model: 'anthropic.claude',
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
      region: 'us-east-1',
      model: 'anthropic.claude',
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

  it('prefers flat fields over nested when both exist (mid-migration)', () => {
    const profile = toProfileType({
      region: 'us-east-1',
      model: 'anthropic.claude',
      profile: 'Acme Corp',
      tone: 'flat tone',
      brandProfile: { tone: 'nested tone', values: 'nested values' },
    });

    expect(profile[ProfileFields.TONE]).toBe('flat tone');
    expect(profile[ProfileFields.VALUES]).toBe('nested values');
  });

  it('returns undefined for missing fields on either shape', () => {
    const profile = toProfileType({ region: 'us-east-1', model: 'anthropic.claude' });

    expect(profile[ProfileFields.VALUES]).toBeUndefined();
    expect(profile[ProfileFields.TONE]).toBeUndefined();
  });
});

describe('parseEnabledFeatures', () => {
  it('parses a JSON-encoded feature list (new schema)', () => {
    const value = JSON.stringify([AIFeature.TITLE, AIFeature.REWRITE]);
    expect(parseEnabledFeatures(value)).toEqual([AIFeature.TITLE, AIFeature.REWRITE]);
  });

  it('accepts a real array for pre-migration installs', () => {
    const arr = [AIFeature.CONTENT, AIFeature.TRANSLATE];
    expect(parseEnabledFeatures(arr)).toEqual(arr);
  });

  it('falls back to all features when value is undefined', () => {
    expect(parseEnabledFeatures(undefined)).toEqual(ALL_FEATURES);
  });

  it('falls back to all features for an empty array or empty JSON array', () => {
    expect(parseEnabledFeatures([])).toEqual(ALL_FEATURES);
    expect(parseEnabledFeatures('[]')).toEqual(ALL_FEATURES);
  });

  it('falls back to all features for an unparseable string', () => {
    expect(parseEnabledFeatures('not json')).toEqual(ALL_FEATURES);
  });
});
