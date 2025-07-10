import contentful from "contentful-management";
import { createCMAClient } from "./createCMAClient.ts";

interface DeleteSpaceProps {
  client?: any;
  spaceId: string;
}

export async function deleteSpace({
  client,
  spaceId,
}: DeleteSpaceProps) {

  if (!client) {
    client = await createCMAClient();
  }

    const space = await client.getSpace(spaceId);
    const spaceName = space.name;
    
    await space.delete();

    console.log(`\n🗑️  🌐 Space deleted! Name: ${spaceName}, ID: ${spaceId}`);
}
  