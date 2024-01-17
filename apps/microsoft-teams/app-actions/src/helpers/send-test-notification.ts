import { AppActionCallResponse } from '../types';

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
): Promise<AppActionCallResponse<string>> => {
  const res = await fetch(`${botServiceUrl}/api/notifications/test_notification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  // TODO: Parse the response instead of the assertion here
  const response = (await res.json()) as AppActionCallResponse<string>;

  return response;
};
