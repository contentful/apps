import { CreateAppActionCallProps } from 'contentful-management';

exports.handler = async (payload: CreateAppActionCallProps) => {
  const { parameters } = payload;

  const response = {
    message: `Hello from your hosted app action. I received the following message as a paramater: ${JSON.stringify(
      parameters.message
    )} `,
  };

  return response;
};
