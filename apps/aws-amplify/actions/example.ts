import { AppActionCallContext } from '@contentful/node-apps-toolkit';

export const handler = async (payload: { [key: string]: any }, context: AppActionCallContext) => {
  const { parameters } = payload;

  const response = {
    message: `Hello from your hosted app action. I received the following message as a paramater: ${JSON.stringify(
      parameters.message
    )} `,
  };

  return response;
};
