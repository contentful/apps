import { Exception } from './exception';

export class SlackError extends Exception<string> {
  constructor(slackError: string) {
    super(409, 'Conflict', slackError);
  }
}
