import {
  EntryActivityMessage,
  MessageResponse,
  MsTeamsBotServiceCallResult,
  TeamInstallation,
} from '../types';

export class MsTeamsBotService {
  constructor(public readonly botServiceUrl: string, public readonly apiKey: string) {}

  async sendEntryActivityMessage(
    entryActivityMessage: EntryActivityMessage,
    tenantId: string
  ): Promise<MsTeamsBotServiceCallResult<MessageResponse>> {
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
    this.assertMsTeamsBotServiceCallResult<MessageResponse>(responseBody, (data) => {
      if (typeof data !== 'object' || !data) throw new TypeError('invalid data type');
      if (!('messageResponseId' in data)) throw new TypeError('not a MessageResponse');
    });
    return responseBody;
  }

  async getTeamInstallations(
    tenantId: string
  ): Promise<MsTeamsBotServiceCallResult<TeamInstallation[]>> {
    const res = await fetch(`${this.botServiceUrl}/api/tenants/${tenantId}/team_installations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
    });
    const responseBody = await res.json();
    this.assertMsTeamsBotServiceCallResult<TeamInstallation[]>(responseBody, (data) => {
      if (!Array.isArray(data)) throw new TypeError('invalid data type');
    });
    return responseBody;
  }

  private assertMsTeamsBotServiceCallResult<T>(
    value: unknown,
    assertsT: (data: unknown) => asserts data is T = () => {}
  ): asserts value is MsTeamsBotServiceCallResult<T> {
    if (typeof value !== 'object' || !value)
      throw new TypeError('invalid type returned from MsTeamsBotService');
    if (!('ok' in value))
      throw new TypeError(
        'malformed MsTeamsBotServiceCallResult returned from MsTeamsBotService API'
      );
    if (value.ok) {
      // success object
      if (!('data' in value))
        throw new TypeError(
          'missing `data` attribute in value returned from MsTeamsBotService API'
        );

      // defer to provided data assertion checker to check value.data type
      assertsT(value.data);
    } else {
      // error object
      if (!('error' in value))
        throw new TypeError(
          'missing `error` attribute in value returned from MsTeamsBotService API'
        );
    }
  }
}
