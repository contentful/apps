interface AppInstallationParameters {
  model: string;
  profile: string;
  brandProfile: ProfileType;
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
 * object type, and declaring the Secret `key` opts the whole object into
 * strict `additionalProperties: false` validation. The nested `brandProfile`
 * used by the config UI is flattened into top-level ProfileType fields here.
 *
 * Every field below must have a matching parameter definition declared on the
 * AppDefinition (`key` as Secret, the rest as Symbol) or saves are rejected.
 */
export type PersistedInstallationParameters = {
  key?: string;
  model: string;
} & ProfileType;

/**
 * Legacy installation shape: before the flatten migration, brand-profile fields
 * were persisted nested under `brandProfile`. Existing installs still carry this
 * until an admin re-saves under the flat schema.
 */
type LegacyInstallationParameters = {
  model?: string;
  profile?: string;
  brandProfile?: ProfileType;
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

export default AppInstallationParameters;
