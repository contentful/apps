export interface Channel {
  // channelresult in frontend
  id: string;
  tenantId: string;
  name: string;
  teamId: string;
  teamName: string;
}

export interface MessageResponse {
  messageResponseId: string;
}

export interface SendTestMessageSuccess {
  ok: boolean;
  data?: MessageResponse;
}

export interface SendTestMessageError {
  ok: boolean;
  error: AppActionError;
}

export type SendTestMessageResult = SendTestMessageSuccess | SendTestMessageError;

export interface AppActionError {
  type: string;
  message: string;
  details?: Record<string, unknown>;
}
export interface AppActionResultSuccess<TResult> {
  ok: true;
  data: TResult;
}
export interface AppActionResultError {
  ok: false;
  error: AppActionError;
}

export type AppActionResult<T> = AppActionResultSuccess<T> | AppActionResultError;
