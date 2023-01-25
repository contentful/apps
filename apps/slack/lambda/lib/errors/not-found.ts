import { Exception } from './exception';

export class NotFoundException extends Exception<string> {
  constructor(details?: string) {
    super(404, 'Not Found', details);
  }
}
