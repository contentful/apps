import { type FC } from 'react';
import { Stack, Text, Checkbox } from '@contentful/f36-components';
import type {
  MigrationPermissions as MigrationPermissionsType,
  MigrationPermissionKey,
} from '../types/config';

interface MigrationPermissionsProps {
  permissions: MigrationPermissionsType;
  onPermissionToggle: (permission: MigrationPermissionKey) => void;
}

export const MigrationPermissions: FC<MigrationPermissionsProps> = ({
  permissions,
  onPermissionToggle,
}) => (
  <Stack flexDirection="column" spacing="spacing2Xs" alignItems="flex-start">
    <Text>
      Allow content and content model migration between spaces and environments.
      To migrate content between environments or spaces, make sure the Remote
      MCP app is installed in the source space.
    </Text>

    <Checkbox
      isChecked={permissions.migrateWithinSpace}
      onChange={() => onPermissionToggle('migrateWithinSpace')}
    >
      Migrate content between environments in this space.
    </Checkbox>

    <Checkbox
      isChecked={permissions.migrateBetweenSpaces}
      onChange={() => onPermissionToggle('migrateBetweenSpaces')}
    >
      Migrate content between spaces. (Both spaces must have this app
      installed.)
    </Checkbox>
  </Stack>
);
