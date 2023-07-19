import { Exception, ExceptionDetails } from './exception';

export class NotFoundException extends Exception<ExceptionDetails> {
  constructor(details?: ExceptionDetails) {
    super(404, 'Not Found', details);
  }
}
