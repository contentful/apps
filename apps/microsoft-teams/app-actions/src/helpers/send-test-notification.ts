import { BotServiceResponse } from '../actions/send-test';

interface TestNotificationPayload {
  teamId: string;
  channelId: string;
  tenantId: string;
  spaceName: string;
  contentTypeName: string;
}

export const sendTestNotification = async (
  botServiceUrl: string,
  apiKey: string,
  payload: TestNotificationPayload
): Promise<BotServiceResponse> => {
  const res = await fetch(`${botServiceUrl}/api/notifications/test_notification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  const response = (await res.json()) as BotServiceResponse;

  return response;
};
