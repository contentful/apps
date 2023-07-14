import { Exception, ExceptionDetails } from './exception';

export class NotFoundException extends Exception<string> {
  constructor(details?: ExceptionDetails) {
    super(404, 'Not Found', details);
  }
}
