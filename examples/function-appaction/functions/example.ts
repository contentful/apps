import { FunctionEventHandler } from '@contentful/node-apps-toolkit';

export const handler: FunctionEventHandler<'appaction.call'> = (event, context) => {
  console.log('this is from my app action function!');
  return {
    action: 'this is my action',
    event,
  };
};
