import { Exception } from './exception';
import { ErrorObject } from 'ajv/dist/types';

export class UnprocessableEntityException extends Exception<ErrorObject[] | string> {
  constructor(details?: ErrorObject[] | string) {
    super(422, 'Unprocessable Entity', details);
  }
}
