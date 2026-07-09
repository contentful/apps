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
  componentTypes: EntityPermissions;
  experiences: EntityPermissions;
  templates: EntityPermissions;
  dataAssemblies: EntityPermissions;
  fragments: EntityPermissions;
}

export interface OtherFeaturesPermissions {
  runAIActions: boolean;
}

export interface MigrationPermissions {
  migrateWithinSpace: boolean;
  migrateBetweenSpaces: boolean;
}

export interface InstallParameters {
  contentLifecyclePermissions: ContentLifecyclePermissions;
  otherFeaturesPermissions: OtherFeaturesPermissions;
  migrationPermissions: MigrationPermissions;
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
  migrateWithinSpace: boolean;
  migrateBetweenSpaces: boolean;
}

export type OtherFeaturesPermissionKey = keyof OtherFeaturesPermissions;
export type MigrationPermissionKey = keyof MigrationPermissions;
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

/** ExO-only entities, gated by space type on the config screen (AIS-187). */
export const EXO_ENTITIES: ContentLifecycleEntityKey[] = [
  'componentTypes',
  'experiences',
  'templates',
  'dataAssemblies',
  'fragments',
];

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
