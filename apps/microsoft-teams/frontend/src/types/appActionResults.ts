// Types that match the backend app action result schemas

export interface ListChannelsResult {
  ok: boolean;
  channels?: ChannelResult[];
  error?: {
    type: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface ChannelResult {
  id: string;
  tenantId: string;
  name: string;
  teamId: string;
  teamName: string;
}

export interface SendTestMessageResult {
  ok: boolean;
  data?: {
    messageResponseId: string;
  };
  error?: {
    type: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Type guards for runtime validation
export function isListChannelsResult(value: unknown): value is ListChannelsResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.ok === 'boolean' &&
    ((obj.channels === undefined && obj.error !== undefined) ||
      (obj.channels !== undefined && obj.error === undefined))
  );
}

export function isChannelResult(value: unknown): value is ChannelResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.ok === 'boolean' &&
    ((obj.channels === undefined && obj.error !== undefined) ||
      (obj.channels !== undefined && obj.error === undefined))
  );
}

export function isSendTestMessageResult(value: unknown): value is SendTestMessageResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.ok === 'boolean' &&
    ((obj.data === undefined && obj.error !== undefined) ||
      (obj.data !== undefined && obj.error === undefined))
  );
}
