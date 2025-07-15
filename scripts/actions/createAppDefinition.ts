import { createCMAClient } from './createCMAClient.ts';
interface CreateAppDefinitionProps {
  client?: any;
  organizationId: string;
  appName: string;
}

export async function createAppDefinition({
  client,
  organizationId,
  appName,
}: CreateAppDefinitionProps) {
  if (!client) {
    client = await createCMAClient();
  }

  const organization = await client.getOrganization(organizationId);
  const appDefinition = await organization.createAppDefinition({
    name: appName,
  });

  console.log(
    `\n🚀 App definition created: ${appDefinition.name} (${appDefinition.sys.id}) in organization: ${organization.name} (${organization.sys.id})`
  );

  return appDefinition;
}
