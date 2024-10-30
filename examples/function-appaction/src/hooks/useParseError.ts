const useParseError = (error: unknown) => {
  const errorMessage =
    typeof error === 'object' && error !== null && 'message' in error ? error.message : '';

  let message = errorMessage as string;
  let statusCode = 500;

  const isJSONObject = (input: string): boolean => {
    try {
      const parsed = JSON.parse(input);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed);
    } catch (e) {
      return false;
    }
  };

  if (typeof errorMessage === 'string' && isJSONObject(errorMessage)) {
    const parsedError = JSON.parse(errorMessage);
    message = parsedError.message;
    statusCode = parsedError.status;
  }

  return { message, statusCode };
};

export default useParseError;
