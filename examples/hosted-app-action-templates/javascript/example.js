exports.handler = async (payload) => {
  const { parameters } = payload;

  const response = {
    message: `Hello from your hosted app action. I received the following message as a paramater: ${JSON.stringify(
      parameters.message
    )} `,
  };

  return response;
};
