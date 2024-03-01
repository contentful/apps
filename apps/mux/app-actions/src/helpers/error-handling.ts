import { AppActionCallResponse, AppActionCallResponseError } from '../types';

// for the purposes of the error handler, a HandlerFunction is one that can take any arguments and return any value -- provided
// it _can_ return an AppActionCallResponseError
type HandlerFunction<TFnReturn, TFnArgs extends unknown[]> = (
  ...args: TFnArgs
) => Promise<TFnReturn | AppActionCallResponseError>;

// function wrapper intended of handlers (but really any function that returns our AppActionCallResponse type)
export const withAsyncAppActionErrorHandling = <
  TResponseType,
  TFnReturn extends AppActionCallResponse<TResponseType>,
  TFnArgs extends unknown[]
>(
  fn: HandlerFunction<TFnReturn, TFnArgs>
): HandlerFunction<TFnReturn, TFnArgs> => {
  const wrappedHandler: HandlerFunction<TFnReturn, TFnArgs> = async (...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      // this is mostly for typescript, to handle the case where a non-Error object gets thrown
      if (!(e instanceof Error)) {
        return {
          ok: false,
          error: {
            message: JSON.stringify(e),
            type: 'UnknownError',
          },
        };
      }

      return {
        ok: false,
        error: {
          type: e.constructor.name,
          message: e.message,
        },
      };
    }
  };
  return wrappedHandler;
};
