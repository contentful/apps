export interface Channel {
  // channelresult in frontend
  id: string;
  tenantId: string;
  name: string;
  teamId: string;
  teamName: string;
}

export interface AppActionError {
  type: string;
  message: string;
  details?: Record<string, unknown>;
}
