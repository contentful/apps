import type {
  EntityPermissions,
  ContentLifecycleEntityKey,
  EntityActionKey,
} from '../components/types/config';
import { ENTITY_AVAILABLE_ACTIONS } from '../components/types/config';

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
 * Creates an entity permissions object with only available actions set to the given value,
 * while keeping unavailable actions as false.
 */
export const createEntityPermissions = (
  entity: ContentLifecycleEntityKey,
  value: boolean
): EntityPermissions => {
  const availableActions = ENTITY_AVAILABLE_ACTIONS[entity];
  const permissions = createEmptyEntityPermissions();

  for (const action of availableActions) {
    permissions[action] = value;
  }

  return permissions;
};

/**
 * Checks if an action is available for a given entity
 */
export const isActionAvailable = (
  entity: ContentLifecycleEntityKey,
  action: EntityActionKey
): boolean => {
  return ENTITY_AVAILABLE_ACTIONS[entity].includes(action);
};

/**
 * Checks if all available permissions for an entity are checked
 */
export const areAllAvailablePermissionsChecked = (
  entity: ContentLifecycleEntityKey,
  permissions: EntityPermissions
): boolean => {
  const availableActions = ENTITY_AVAILABLE_ACTIONS[entity];
  return availableActions.every((action) => permissions[action]);
};
