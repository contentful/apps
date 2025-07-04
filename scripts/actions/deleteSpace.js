export async function deleteSpace(client, spaceId) {

    const space = await client.getSpace(spaceId);
    const spaceName = space.name;
    
    await space.delete();

    console.log(`\n🗑️  🌐 Space deleted! Name: ${spaceName}, ID: ${spaceId}`);
  }
  