import { SendMessageResult } from '../types';

interface TestMessagePayload {
  channel: {
    teamId: string;
    channelId: string;
  };
  contentTypeName: string;
}

export const sendTestMessage = async (
  botServiceUrl: string,
  apiKey: string,
  tenantId: string,
  payload: TestMessagePayload
): Promise<SendMessageResult> => {
  const res = await fetch(`${botServiceUrl}/api/tenant/${tenantId}/test_messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  // TODO: Parse the response instead of the assertion here
  const response = (await res.json()) as SendMessageResult;

  return response;
};
