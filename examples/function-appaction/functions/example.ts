import { FunctionEventHandler } from '@contentful/node-apps-toolkit';
import {
  AppActionRequest,
  FunctionEventContext,
} from '@contentful/node-apps-toolkit/lib/requests/typings';

// When using a 'Custom' category App Action, you may define the parameters that the App Action will receive.
// This should match what you configured in the App Action definition.
type MyCustomAppActionParameters = {
  foo: string;
};

export const handler: FunctionEventHandler<'appaction.call'> = async (
  event: AppActionRequest<'Custom', MyCustomAppActionParameters>, // For better typing, specify your App Action category and, if using the 'Custom' category, parameter types here
  context: FunctionEventContext
) => {
  const cma = context.cma!; // App Action Call Functions have access to the authenticated CMA client

  const { foo } = event.body; // Access the parameters passed to the App Action Call via the event body

  console.log('this is from my app action function!');
  return {
    action: 'this is my action',
    event,
    foo,
    someExampleUsingCMA: await cma.locale.getMany({}),
  };
};
