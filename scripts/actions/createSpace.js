

export async function createSpace(client, organizationId, spaceName) {

  const space = await client.createSpace({name: spaceName},organizationId);

  console.log(`\n🌐 Space created! Name: ${space.name}, ID: ${space.sys.id}`);

  return space;
}
