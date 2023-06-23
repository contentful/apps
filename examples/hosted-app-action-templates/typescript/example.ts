import { AppActionCallContext } from '@contentful/node-apps-toolkit';

export const handler = async (
  parameters: { [key: string]: any },
  context: AppActionCallContext
) => {
  const response = {
    message: `Hello from your hosted app action. I received the following message as a parameter: ${JSON.stringify(
      parameters
    )} `,
  };

  return response;
};
