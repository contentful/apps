export async function uninstallApp(client, spaceId, environmentId, appDefinitionId) {

  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);

  const appInstallation = await environment.getAppInstallation(appDefinitionId);
  await appInstallation.delete();

  console.log('✅ App uninstalled successfully!');
}
