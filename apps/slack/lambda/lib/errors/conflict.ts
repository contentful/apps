import { Exception, ExceptionDetails } from './exception';

export class ConflictException extends Exception<string> {
  constructor(details?: ExceptionDetails) {
    super(409, 'Conflict', details);
  }
}
