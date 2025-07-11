import contentful from 'contentful-management';
import { createCMAClient } from './createCMAClient.ts';

interface DeleteAppDefinitionProps {
  client?: any;
  organizationId: string;
  appDefinitionId: string;
}

export async function deleteAppDefinition({
  client,
  organizationId,
  appDefinitionId,
}: DeleteAppDefinitionProps) {
  if (!client) {
    client = await createCMAClient();
  }

  const org = await client.getOrganization(organizationId);
  const appDefinition = await org.getAppDefinition(appDefinitionId);

  await appDefinition.delete();

  console.log(`\n🗑️  AppDefinition '${appDefinitionId}' deleted successfully!`);
}
