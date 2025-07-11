import contentful from 'contentful-management';
import { createCMAClient } from './createCMAClient.ts';

interface UninstallAppProps {
  client?: any;
  spaceId: string;
  environmentId: string;
  appDefinitionId: string;
}

export async function uninstallApp({
  client,
  spaceId,
  environmentId,
  appDefinitionId,
}: UninstallAppProps) {
  if (!client) {
    client = await createCMAClient();
  }

  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);

  const appInstallation = await environment.getAppInstallation(appDefinitionId);
  await appInstallation.delete();

  console.log('✅ App uninstalled successfully!');
}
