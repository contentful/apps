export interface EntityPermissions {
  read: boolean;
  edit?: boolean;
  create?: boolean;
  delete?: boolean;
  publish?: boolean;
  unpublish?: boolean;
  archive?: boolean;
  unarchive?: boolean;
  invoke?: boolean;
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
  runAIActions: boolean;
  migrateWithinSpace: boolean;
  migrateBetweenSpaces: boolean;
}

export type OtherFeaturesPermissionKey = keyof OtherFeaturesPermissions;
export type MigrationPermissionKey = keyof MigrationPermissions;
export type ContentLifecycleEntityKey = Exclude<keyof ContentLifecyclePermissions, 'selectAll'>;
export type EntityActionKey = keyof EntityPermissions;
