import contentful from "contentful-management";
import { createCMAClient } from "./createCMAClient.ts";

interface InstallAppProps {
  client?: any;
  spaceId: string;
  environmentId?: string;
  appDefinitionId: string;
}

export async function installApp({
  client,
  spaceId,
  environmentId = 'master',
  appDefinitionId,
}: InstallAppProps) {


  if (!client) {
    client = await createCMAClient();
  }

  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);

  await environment.createAppInstallation(appDefinitionId, {
    parameters: {
    },
  });

  console.log('\n🚀 App ', '(', appDefinitionId,')',' installed successfully!', 'in space:', space.name,'(', space.sys.id,')', 'in environment:', environment.sys.id);
}



