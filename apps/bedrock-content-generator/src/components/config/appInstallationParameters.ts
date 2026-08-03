import featureConfig, { AIFeature } from '@configs/features/featureConfig';

interface AppInstallationParameters {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  model: string;
  profile: string;
  brandProfile: ProfileType;
  enabledFeatures?: AIFeature[];
}

export enum ProfileFields {
  PROFILE = 'profile',
  VALUES = 'values',
  TONE = 'tone',
  EXCLUDE = 'exclude',
  INCLUDE = 'include',
  AUDIENCE = 'audience',
  ADDITIONAL = 'additional',
}

export type ProfileType = {
  [K in ProfileFields]?: string;
};

/**
 * The shape actually persisted to (and read from) Contentful installation
 * parameters. It is flat because installation parameter definitions only
 * support scalar types (Symbol/Enum/Number/Boolean/Secret) — there is no
 * object type, and declaring the Secret credentials opts the whole object into
 * strict `additionalProperties: false` validation. The nested `brandProfile`
 * used by the config UI is flattened into top-level ProfileType fields here.
 * `enabledFeatures` is JSON-encoded as a Symbol (array not supported).
 *
 * Every field below must have a matching parameter definition declared on the
 * AppDefinition (`accessKeyId` and `secretAccessKey` as Secret, the rest as
 * Symbol) or saves are rejected.
 */
export type PersistedInstallationParameters = {
  accessKeyId?: string;
  secretAccessKey?: string;
  region: string;
  model: string;
  enabledFeatures?: string;
} & ProfileType;

/**
 * Legacy installation shape: before the flatten migration, brand-profile fields
 * were persisted nested under `brandProfile` and `enabledFeatures` was stored as
 * a real array (not a JSON-encoded Symbol). Existing installs still carry this
 * until an admin re-saves under the flat schema.
 */
type LegacyInstallationParameters = {
  model?: string;
  region?: string;
  profile?: string;
  brandProfile?: ProfileType;
  enabledFeatures?: AIFeature[] | string;
};

/**
 * Dual-read the brand profile from installation params. Prefers the flat top-level
 * fields (new schema); falls back to the legacy nested `brandProfile` for installs
 * that haven't re-saved yet. Keeps config, dialog, and sidebar reading the same way
 * so existing customers don't silently lose brand context before they migrate.
 */
export const toProfileType = (
  installation: PersistedInstallationParameters | LegacyInstallationParameters
): ProfileType => {
  const nested = (installation as LegacyInstallationParameters).brandProfile ?? {};
  const flat = installation as ProfileType;
  const read = (field: ProfileFields): string | undefined => flat[field] ?? nested[field];

  return {
    [ProfileFields.PROFILE]: installation.profile,
    [ProfileFields.VALUES]: read(ProfileFields.VALUES),
    [ProfileFields.TONE]: read(ProfileFields.TONE),
    [ProfileFields.EXCLUDE]: read(ProfileFields.EXCLUDE),
    [ProfileFields.INCLUDE]: read(ProfileFields.INCLUDE),
    [ProfileFields.AUDIENCE]: read(ProfileFields.AUDIENCE),
    [ProfileFields.ADDITIONAL]: read(ProfileFields.ADDITIONAL),
  };
};

/**
 * Dual-read `enabledFeatures`. The new schema stores it JSON-encoded as a Symbol
 * (installation params are scalar-only), but pre-migration installs still have a
 * real `AIFeature[]`. Accept both shapes and fall back to all features when the
 * value is absent or unparseable, so existing customers keep their feature
 * selection instead of silently reverting to "all features".
 */
export const parseEnabledFeatures = (
  value: AIFeature[] | string | undefined
): AIFeature[] => {
  const allFeatures = () => Object.keys(featureConfig) as AIFeature[];

  if (Array.isArray(value)) {
    return value.length > 0 ? value : allFeatures();
  }
  if (!value) return allFeatures();

  try {
    const parsed = JSON.parse(value) as AIFeature[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : allFeatures();
  } catch {
    return allFeatures();
  }
};

export default AppInstallationParameters;
