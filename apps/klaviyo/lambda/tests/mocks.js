// Mock helpers for Klaviyo tests
const MockInterface = {
  // Simplified mock response for successful responses
  successResponse: (data = {}) => ({
    data,
    headers: {},
    status: 200,
    statusText: 'OK',
    config: {},
  }),

  // Simplified mock error response
  errorResponse: (status = 400, message = 'Bad Request', data = {}) => {
    const error = new Error(message);
    error.response = {
      data,
      status,
      statusText: message,
      headers: {},
      config: {},
    };
    error.isAxiosError = true;
    return error;
  },
};

module.exports = MockInterface;
