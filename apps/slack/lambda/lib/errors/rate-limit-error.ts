import { Exception, ExceptionDetails } from './exception';

export class RateLimitError extends Exception<ExceptionDetails> {
  constructor(details?: ExceptionDetails) {
    super(429, 'Rate limit reached', details);
  }
}