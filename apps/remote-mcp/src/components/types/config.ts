export interface EntityPermissions {
  read: boolean;
  edit: boolean;
  create: boolean;
  delete: boolean;
  publish: boolean;
  unpublish: boolean;
  archive: boolean;
  unarchive: boolean;
}

export interface ContentLifecyclePermissions {
  selectAll: boolean;
  entries: EntityPermissions;
  assets: EntityPermissions;
  contentTypes: EntityPermissions;
}

export interface OtherFeaturesPermissions {
  runAIActions: boolean;
  triggerAutomations: boolean;
  installApps: boolean;
  callAppActions: boolean;
  invokeAgents: boolean;
}

export interface MigrationPermissions {
  migrateWithinSpace: boolean;
  migrateBetweenSpaces: boolean;
}

export type OtherFeaturesPermissionKey = keyof OtherFeaturesPermissions;
export type MigrationPermissionKey = keyof MigrationPermissions;
