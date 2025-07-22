import { createCMAClient } from './createCMAClient';
import { deleteSpace } from './deleteSpace';
import { deleteAppDefinition } from './deleteAppDefinition';

interface TeardownProps {
  client?: any;
  organizationId: string;
  spaceIdStaging: string;
  spaceIdProduction: string;
  appDefinitionIdStaging: string;
  appDefinitionIdProduction: string;
}

export async function teardown({
  client,
  organizationId,
  spaceIdStaging,
  spaceIdProduction,
  appDefinitionIdStaging,
  appDefinitionIdProduction,
}: TeardownProps) {
  if (!client) {
    client = await createCMAClient();
  }

  await deleteSpace({ client, spaceId: spaceIdStaging });
  await deleteAppDefinition({
    client,
    organizationId,
    appDefinitionId: appDefinitionIdStaging,
  });

  await deleteSpace({ client, spaceId: spaceIdProduction });
  await deleteAppDefinition({
    client,
    organizationId,
    appDefinitionId: appDefinitionIdProduction,
  });

  console.log('🗑️  Cleanup completed successfully');
}
