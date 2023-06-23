export const handler = async (parameters) => {
  const response = {
    message: `Hello from your hosted app action. I received the following message as a parameter: ${JSON.stringify(
      parameters
    )} `,
  };

  return response;
};
