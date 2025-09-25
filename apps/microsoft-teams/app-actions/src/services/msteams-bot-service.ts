import {
  AppActionRequestContext,
  EntryActivityMessage,
  MsTeamsBotServiceResponse,
  TeamInstallation,
  TestMessage,
  WorkflowUpdateMessage,
} from '../types';
import { MessageResponse } from '../../../types';

export class MsTeamsBotService {
  constructor(public readonly botServiceUrl: string, public readonly apiKey: string) {}

  async sendWorkflowUpdateMessage(
    workflowUpdateMessage: WorkflowUpdateMessage,
    tenantId: string,
    requestContext: AppActionRequestContext
  ): Promise<MsTeamsBotServiceResponse<MessageResponse>> {
    const res = await fetch(
      `${this.botServiceUrl}/api/tenant/${tenantId}/workflow_update_messages`,
      {
        method: 'POST',
        headers: this.getRequestHeaders(requestContext),
        body: JSON.stringify(workflowUpdateMessage),
      }
    );

    const responseBody = await res.json();
    this.assertMsTeamsBotServiceCallResult<MessageResponse>(
      responseBody,
      this.assertMessageResponse
    );
    return responseBody;
  }

  async sendEntryActivityMessage(
    entryActivityMessage: EntryActivityMessage,
    tenantId: string,
    requestContext: AppActionRequestContext
  ): Promise<MsTeamsBotServiceResponse<MessageResponse>> {
    const res = await fetch(
      `${this.botServiceUrl}/api/tenant/${tenantId}/entry_activity_messages`,
      {
        method: 'POST',
        headers: this.getRequestHeaders(requestContext),
        body: JSON.stringify(entryActivityMessage),
      }
    );
    const responseBody = await res.json();
    this.assertMsTeamsBotServiceCallResult<MessageResponse>(
      responseBody,
      this.assertMessageResponse
    );
    return responseBody;
  }

  async sendTestMessage(
    testMessage: TestMessage,
    tenantId: string,
    requestContext: AppActionRequestContext
  ): Promise<MsTeamsBotServiceResponse<MessageResponse>> {
    const res = await fetch(`${this.botServiceUrl}/api/tenant/${tenantId}/test_messages`, {
      method: 'POST',
      headers: this.getRequestHeaders(requestContext),
      body: JSON.stringify(testMessage),
    });
    const responseBody = await res.json();
    this.assertMsTeamsBotServiceCallResult<MessageResponse>(
      responseBody,
      this.assertMessageResponse
    );
    return responseBody;
  }

  async getTeamInstallations(
    tenantId: string,
    requestContext: AppActionRequestContext
  ): Promise<MsTeamsBotServiceResponse<TeamInstallation[]>> {
    const res = await fetch(`${this.botServiceUrl}/api/tenants/${tenantId}/team_installations`, {
      method: 'GET',
      headers: this.getRequestHeaders(requestContext),
    });
    const responseBody = await res.json();
    this.assertMsTeamsBotServiceCallResult<TeamInstallation[]>(responseBody, (data) => {
      if (!Array.isArray(data)) throw new TypeError('invalid data type');
    });
    return responseBody;
  }

  private getRequestHeaders(requestContext: AppActionRequestContext) {
    const { environmentId, userId, spaceId, appInstallationId } = requestContext;
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'X-Contentful-App': appInstallationId,
      'X-Contentful-Environment': environmentId,
      'X-Contentful-Space': spaceId,
      'X-Contentful-User': userId,
    };
  }

  private assertMsTeamsBotServiceCallResult<T>(
    value: unknown,
    assertsT: (data: unknown) => asserts data is T = () => {}
  ): asserts value is MsTeamsBotServiceResponse<T> {
    if (typeof value !== 'object' || !value)
      throw new TypeError('invalid type returned from MsTeamsBotService');
    if (!('ok' in value))
      throw new TypeError(
        'malformed MsTeamsBotServiceResponse returned from MsTeamsBotService API'
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

  private assertMessageResponse(data: unknown) {
    if (typeof data !== 'object' || !data) throw new TypeError('invalid data type');
    if (!('messageResponseId' in data)) throw new TypeError('not a MessageResponse');
  }
}
