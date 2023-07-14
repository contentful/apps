import { Exception, ExceptionDetails } from './exception';
import { ErrorObject } from 'ajv/dist/types';

export class UnprocessableEntityException extends Exception<ErrorObject[] | string> {
  constructor(details?: ExceptionDetails) {
    super(422, 'Unprocessable Entity', details);
  }
}
