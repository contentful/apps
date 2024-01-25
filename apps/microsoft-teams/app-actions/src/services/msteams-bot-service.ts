import { EntryActivityMessage, SendMessageResult } from '../types';

export class MsTeamsBotService {
  constructor(public readonly botServiceUrl: string, public readonly apiKey: string) {}

  async sendEntryActivityMessage(
    entryActivityMessage: EntryActivityMessage,
    tenantId: string
  ): Promise<SendMessageResult> {
    const res = await fetch(
      `${this.botServiceUrl}/api/tenant/${tenantId}/entry_activity_messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(entryActivityMessage),
      }
    );
    const responseBody = await res.json();
    this.assertSendMessageResult(responseBody);
    return responseBody;
  }

  private assertSendMessageResult(value: unknown): asserts value is SendMessageResult {
    if (typeof value !== 'object' || !value)
      throw new TypeError('invalid type returned from MsTeamsBotService');
    if (!('ok' in value))
      throw new TypeError('malformed SendMessageResult returned from MsTeamsBotService API');
  }
}
