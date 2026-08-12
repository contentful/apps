export interface EntityPermissions {
  read: boolean;
  edit: boolean;
  create: boolean;
  delete: boolean;
  publish: boolean;
  unpublish: boolean;
  archive: boolean;
  unarchive: boolean;
  invoke: boolean;
}

export interface ContentLifecyclePermissions {
  selectAll: boolean;
  entries: EntityPermissions;
  assets: EntityPermissions;
  contentTypes: EntityPermissions;
  aiActions: EntityPermissions;
  editorInterfaces: EntityPermissions;
  environments: EntityPermissions;
  locales: EntityPermissions;
  orgs: EntityPermissions;
  spaces: EntityPermissions;
  tags: EntityPermissions;
  concepts: EntityPermissions;
  conceptSchemes: EntityPermissions;
  // ExO (Experience Orchestration) entities. Shown on the config screen only
  // in ExO-enabled or empty spaces. See AIS-187.
  //
  // These keys predate the entity renaming (Component Type →
  // Component, Template → Experience Template, Fragment → Experience
  // Fragment) and are deliberately left alone: Only the user-facing labels in
  // ../access-config/ContentLifecyclePermissionsTable.tsx were renamed.
  componentTypes: EntityPermissions;
  experiences: EntityPermissions;
  templates: EntityPermissions;
  dataAssemblies: EntityPermissions;
  fragments: EntityPermissions;
}

export interface OtherFeaturesPermissions {
  runAIActions: boolean;
}

export interface InstallParameters {
  contentLifecyclePermissions: ContentLifecyclePermissions;
  otherFeaturesPermissions: OtherFeaturesPermissions;
}

export interface AppInstallationParameters {
  selectAll: boolean;
  entries: string;
  assets: string;
  contentTypes: string;
  aiActions: string;
  editorInterfaces: string;
  environments: string;
  locales: string;
  orgs: string;
  spaces: string;
  tags: string;
  concepts: string;
  conceptSchemes: string;
  componentTypes: string;
  experiences: string;
  templates: string;
  dataAssemblies: string;
  fragments: string;
  runAIActions: boolean;
}

export type OtherFeaturesPermissionKey = keyof OtherFeaturesPermissions;
export type ContentLifecycleEntityKey = Exclude<keyof ContentLifecyclePermissions, 'selectAll'>;
export type EntityActionKey = keyof EntityPermissions;

/**
 * Mapping of each entity to the actions that are available via MCP tools.
 * Based on the available MCP server tools.
 */
export const ENTITY_AVAILABLE_ACTIONS: Record<
  ContentLifecycleEntityKey,
  readonly EntityActionKey[]
> = {
  entries: ['read', 'edit', 'create', 'delete', 'publish', 'unpublish', 'archive', 'unarchive'],
  assets: ['read', 'edit', 'create', 'delete', 'publish', 'unpublish', 'archive', 'unarchive'],
  contentTypes: ['read', 'edit', 'create', 'delete', 'publish', 'unpublish'],
  aiActions: ['read', 'edit', 'create', 'delete', 'publish', 'unpublish', 'invoke'],
  locales: ['read', 'edit', 'create', 'delete'],
  concepts: ['read', 'edit', 'create', 'delete'],
  conceptSchemes: ['read', 'edit', 'create', 'delete'],
  environments: ['read', 'create', 'delete'],
  editorInterfaces: ['read', 'edit'],
  tags: ['read', 'create'],
  orgs: ['read'],
  spaces: ['read'],
  componentTypes: ['read'],
  experiences: ['read', 'edit', 'create', 'delete', 'publish', 'unpublish'],
  templates: ['read'],
  dataAssemblies: ['read'],
  fragments: ['read', 'edit', 'create', 'delete'],
} as const;

/** All entity keys derived from ENTITY_AVAILABLE_ACTIONS */
export const ALL_ENTITIES = Object.keys(ENTITY_AVAILABLE_ACTIONS) as ContentLifecycleEntityKey[];

/**
 * ExO (Experience Orchestration) entities. Rendered in their own
 * "Experience orchestration actions" section on the config screen. These tools
 * only function in ExO-compatible spaces; the section note calls this out.
 * ExO-compatibility can't be detected from within an app (the App SDK CMA
 * blocks reads of ExO entity types), so we always show the section rather than
 * gate it. See AIS-187.
 */
export const EXO_ENTITIES: ContentLifecycleEntityKey[] = [
  'componentTypes',
  'experiences',
  'templates',
  'dataAssemblies',
  'fragments',
];

/** Classic (non-ExO) entities, rendered in the "Content lifecycle actions" section. */
export const CLASSIC_ENTITIES: ContentLifecycleEntityKey[] = ALL_ENTITIES.filter(
  (entity) => !EXO_ENTITIES.includes(entity)
);

/** All actions shown in table columns */
export const STANDARD_ACTIONS: EntityActionKey[] = [
  'read',
  'edit',
  'create',
  'delete',
  'publish',
  'unpublish',
  'archive',
  'unarchive',
  'invoke',
];

/** Actions relevant to ExO entities — STANDARD_ACTIONS trimmed to those used by at least one ExO entity. */
export const EXO_ACTIONS: EntityActionKey[] = STANDARD_ACTIONS.filter((action) =>
  EXO_ENTITIES.some((entity) =>
    (ENTITY_AVAILABLE_ACTIONS[entity] as readonly EntityActionKey[]).includes(action)
  )
);
