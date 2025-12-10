import { type FC } from 'react';
import { Stack, Text, Checkbox } from '@contentful/f36-components';
import type {
  OtherFeaturesPermissions as OtherFeaturesPermissionsType,
  OtherFeaturesPermissionKey,
} from '../types/config';

interface OtherFeaturesPermissionsProps {
  permissions: OtherFeaturesPermissionsType;
  onPermissionToggle: (permission: OtherFeaturesPermissionKey) => void;
}

export const OtherFeaturesPermissions: FC<OtherFeaturesPermissionsProps> = ({
  permissions,
  onPermissionToggle,
}) => (
  <Stack flexDirection="column" spacing="spacing2Xs" alignItems="flex-start">
    <Text>
      Allow the MCP server to take other actions within your Contentful space.
    </Text>

    <Checkbox
      isChecked={permissions.runAIActions}
      onChange={() => onPermissionToggle('runAIActions')}
    >
      Run AI actions (available for premium customers)
    </Checkbox>
  </Stack>
);
