import { errorMessages } from '@constants/errorMessages';
import { Errors } from '@customTypes/configPage';
import { isEmpty, pickBy } from 'lodash';

type Error =
  | Errors['authentication']
  | Errors['apiPathSelection']
  | Errors['projectSelection']
  | Errors['previewPathSelection'];
type ErrorKeys =
  | keyof Errors['authentication']
  | keyof Errors['apiPathSelection']
  | keyof Errors['projectSelection']
  | keyof Errors['previewPathSelection'];

export const getErrorMessage = (error: Error) => {
  const currentError = pickBy(error);
  const errorKey: ErrorKeys = Object.keys(currentError)[0] as ErrorKeys;
  const message = errorMessages[errorKey];
  return message;
};

export const useError = (error?: Error) => {
  const errorMessage = error ? getErrorMessage(error) : '';
  return { message: errorMessage, isError: !isEmpty(pickBy(error)) };
};
