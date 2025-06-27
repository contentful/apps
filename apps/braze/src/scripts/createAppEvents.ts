import { appDefinitionId, client, functionId, organizationId } from './contentfulClientAndImports';

export const createAppEventSubscription = async () => {
  try {
    const eventSubscription = await client.appEventSubscription.upsert(
      {
        organizationId,
        appDefinitionId,
      },
      {
        topics: ['Entry.save', 'Entry.auto_save', 'Entry.delete', 'AppInstallation.delete'],
        functions: {
          handler: {
            sys: {
              type: 'Link',
              linkType: 'Function',
              id: functionId,
            },
          },
        },
      }
    );

    console.log('Subscription created');
    console.dir(eventSubscription, { depth: 5 });
  } catch (error) {
    console.error(error);
  }
};

// Only execute if this file is run directly (not imported for testing)
if (require.main === module) {
  createAppEventSubscription();
}
