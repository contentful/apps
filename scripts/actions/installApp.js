
export async function installApp( client, spaceId, environmentId = 'master', appDefinitionId ) {

  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);

  await environment.createAppInstallation(appDefinitionId, {
    parameters: {
    },
  });

  console.log('\n🚀 App ', '(', appDefinitionId,')',' installed successfully!', 'in space:', space.name,'(', space.sys.id,')', 'in environment:', environment.sys.id);
}



