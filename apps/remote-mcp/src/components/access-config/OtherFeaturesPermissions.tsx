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
      Run AI actions
    </Checkbox>

    <Checkbox
      isChecked={permissions.triggerAutomations}
      onChange={() => onPermissionToggle('triggerAutomations')}
    >
      Trigger automations
    </Checkbox>

    <Checkbox
      isChecked={permissions.installApps}
      onChange={() => onPermissionToggle('installApps')}
    >
      Install and configure apps from the marketplace
    </Checkbox>

    <Checkbox
      isChecked={permissions.callAppActions}
      onChange={() => onPermissionToggle('callAppActions')}
    >
      Call app actions
    </Checkbox>

    <Checkbox
      isChecked={permissions.invokeAgents}
      onChange={() => onPermissionToggle('invokeAgents')}
    >
      Invoke and set up other Contentful agents
    </Checkbox>
  </Stack>
);
