import { createCMAClient } from './createCMAClient.ts';

interface CreateSpaceOptions {
  client?: any;
  organizationId: string;
  spaceName: string;
}

export async function createSpace({ client, organizationId, spaceName }: CreateSpaceOptions) {
  if (!client) {
    client = await createCMAClient();
  }

  const space = await client.createSpace({ name: spaceName }, organizationId);

  console.log(`\n🌐 Space created! Name: ${space.name}, ID: ${space.sys.id}`);

  return space;
}
