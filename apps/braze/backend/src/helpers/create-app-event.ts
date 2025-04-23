import {
  client,
  organizationId,
  appDefinitionId,
  functionId,
} from './contentful-client-and-imports';

const createAppEventSubscription = async () => {
  try {
    const eventSubscription = await client.appEventSubscription.upsert(
      {
        organizationId,
        appDefinitionId,
      },
      {
        topics: [
          'Entry.create',
          'Entry.save',
          'Entry.auto_save',
          'Entry.archive',
          'Entry.unarchive',
          'Entry.publish',
          'Entry.unpublish',
          'Entry.delete',
        ],
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

createAppEventSubscription();
