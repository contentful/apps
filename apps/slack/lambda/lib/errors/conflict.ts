import { Exception, ExceptionDetails } from './exception';

export class ConflictException extends Exception<ExceptionDetails> {
  constructor(details?: ExceptionDetails) {
    super(409, 'Conflict', details);
  }
}
