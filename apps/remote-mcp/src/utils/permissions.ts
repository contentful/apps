import type { EntityPermissions } from '../components/types/config';

/**
 * Creates an empty entity permissions object with all permissions set to false
 */
export const createEmptyEntityPermissions = (): EntityPermissions => ({
  read: false,
  edit: false,
  create: false,
  delete: false,
  publish: false,
  unpublish: false,
  archive: false,
  unarchive: false,
  invoke: false,
});

/**
 * Creates an entity permissions object with all permissions set to the given value
 */
export const createAllPermissions = (value: boolean): EntityPermissions => ({
  read: value,
  edit: value,
  create: value,
  delete: value,
  publish: value,
  unpublish: value,
  archive: value,
  unarchive: value,
  invoke: value,
});

/**
 * Checks if all permissions in an entity permissions object are checked
 */
export const areAllPermissionsChecked = (permissions: EntityPermissions): boolean => {
  return Object.values(permissions).every((v) => v);
};
