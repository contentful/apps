import type { FunctionEventHandler as EventHandler } from '@contentful/node-apps-toolkit';
import type {
  AppEventComment,
  AppEventRequest,
  FunctionEventContext,
} from '@contentful/node-apps-toolkit/lib/requests/typings';
import type { CreateCommentBody } from './types';
import { getAction } from './bot-actions/bot-action-registry';

export const handler: EventHandler<'appevent.handler'> = async (
  event: AppEventRequest,
  context: FunctionEventContext
) => {
  const { body } = event as AppEventComment;
  const createCommentBody = body as unknown as CreateCommentBody;
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
