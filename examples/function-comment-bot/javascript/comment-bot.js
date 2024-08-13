import { getAction } from './bot-actions/bot-action-registry';

export const handler = async (event, context) => {
  const { body: createCommentBody } = event;
  const { parentEntity } = createCommentBody.sys.newComment.sys;
  const commentBody = createCommentBody.sys.newComment.body;

  const action = getAction(commentBody);
  if (action) {
    await action.execute({
      commentBody,
      context,
      parentEntityId: parentEntity.sys.id,
    });
  } else {
    console.debug(`Comment (${commentBody}) was not a known command`);
  }
};
