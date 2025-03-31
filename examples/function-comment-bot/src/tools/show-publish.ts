import { client, spaceId, environmentId, entryId } from './contentful-client-and-imports';

export const createComment = async () => {
  if (!entryId) {
    console.error('No entry ID provided');
    return;
  } else {
    try {
      const comment = await client.comment.create(
        {
          spaceId,
          environmentId,
          entryId,
        },
        {
          body: '/show-publish',
          status: 'active',
        }
      );

      console.log('Comment created');
      console.dir(comment, { depth: 5 });
    } catch (error) {
      console.error(error);
    }
  }
};

createComment();
