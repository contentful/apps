import type { FunctionEventContext } from '@contentful/node-apps-toolkit';
import type { CommentProps, PlainClientAPI } from 'contentful-management';

export interface BotAction {
  execute: (params: BotActionParams) => Promise<void>;
}

export type BotActionParams = {
  commentBody: string;
  context: FunctionEventContext;
  [key: string]: any; // Allows for extra parameters specific to an action
};

export type CreateCommentBody = {
  sys: CommentProps['sys'] & {
    newComment: CommentProps;
  };
};

export function isManagementContextInvocation<P extends Record<string, any>>(
  context: FunctionEventContext<P>
): context is FunctionEventContext<P> & { cma: PlainClientAPI } {
  return !!context.cma;
}
