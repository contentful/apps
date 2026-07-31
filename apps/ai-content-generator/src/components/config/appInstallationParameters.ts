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

export default AppInstallationParameters;
