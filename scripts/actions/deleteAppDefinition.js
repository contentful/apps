export async function deleteAppDefinition(client, organizationId, appDefinitionId) {

    const org = await client.getOrganization(organizationId);
    const appDefinition = await org.getAppDefinition(appDefinitionId);
  
    await appDefinition.delete();
  
    console.log(`\n🗑️  AppDefinition '${appDefinitionId}' deleted successfully!`);
  }