import { Exception } from './exception';

export class ConflictException extends Exception<string> {
  constructor(details?: string) {
    super(409, 'Conflict', details);
  }
}
