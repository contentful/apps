import { Exception, ExceptionDetails } from './exception';
import { ErrorObject } from 'ajv/dist/types';

export class UnprocessableEntityException extends Exception<ErrorObject[] | ExceptionDetails> {
  constructor(details?: ExceptionDetails) {
    super(422, 'Unprocessable Entity', details);
  }
}
