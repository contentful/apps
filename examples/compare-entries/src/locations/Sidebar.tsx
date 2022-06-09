import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { Button, Select, Stack } from '@contentful/f36-components';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { EnvironmentProps, SpaceProps } from 'contentful-management';
import React, { useEffect, useState } from 'react';

const Sidebar = () => {
  const sdk = useSDK<SidebarExtensionSDK>();
  const cma = useCMA();

  const [environments, setEnvironments] = useState<EnvironmentProps[] | undefined>(undefined);
  const [spaces, setSpaces] = useState<SpaceProps[] | undefined>(undefined);

  const [environmentId, setEnvironmentId] = useState<string | undefined>(undefined);

  useEffect(() => {
    sdk.window.startAutoResizer();
  }, [sdk.window]);

  useEffect(() => {
    cma.appDefinition
      .getInstallationsForOrg({
        organizationId: sdk.ids.organization,
        appDefinitionId: sdk.ids.app!,
      })
      .then((installations) => {
        setEnvironmentId(installations.includes.Environment[0].sys.id);
        setEnvironments(installations.includes.Environment);
      });
  }, [cma.appDefinition, cma.space, sdk]);

  useEffect(() => {
    if (!environments) {
      return;
    }

    const uniqueSpaces = Array.from(new Set([...environments.map((env) => env.sys.space.sys.id)]));
    Promise.all(
      uniqueSpaces.map((spaceId) =>
        cma.space.get({
          spaceId,
        })
      )
    ).then((spaces) => {
      setSpaces(spaces);
    });
  }, [cma.space, environments]);

  if (!environments || !spaces) {
    return null;
  }

  return (
    <Stack flexDirection="column" alignItems="flex-start">
      <Select onChange={(e) => setEnvironmentId(e.target.value)}>
        {environments.map((environment) => (
          <Select.Option key={environment.sys.id} value={environment.sys.id}>
            {spaces.find((space) => space.sys.id === environment.sys.space.sys.id)?.name!} /{' '}
            {environment.name}
          </Select.Option>
        ))}
      </Select>
      <Button
        onClick={() => {
          const environment = environments.find((env) => env.sys.id === environmentId)!;
          const space = spaces.find((s) => s.sys.id === environment.sys.space.sys.id)!;

          sdk.dialogs.openCurrentApp({
            title: 'Compare Entry',
            allowHeightOverflow: true,
            shouldCloseOnOverlayClick: true,
            shouldCloseOnEscapePress: true,
            width: 'fullWidth',
            parameters: {
              leftEntry: {
                spaceId: sdk.ids.space,
                environmentId: sdk.ids.environment,
                entryId: sdk.ids.entry,
              },
              rightEntry: {
                spaceId: space.sys.id,
                environmentId: environmentId!,
                entryId: sdk.ids.entry,
              },
            },
          });
        }}
      >
        Compare with environment
      </Button>
    </Stack>
  );
};

export default Sidebar;
