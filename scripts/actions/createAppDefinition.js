export async function createAppDefinition(client, organizationId, appName) {

    const organization = await client.getOrganization(organizationId);
    const appDefinition = await organization.createAppDefinition({
        name: appName
    });

    console.log('\n🚀 App definition created:', appDefinition.name,'(', appDefinition.sys.id,')', 'in organization:', organization.name,'(', organization.sys.id,')');

    return appDefinition;
}