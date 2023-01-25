export enum EventName {
  TokensRevoked = 'tokens_revoked',
}

export type EventMap = {
  [EventName.TokensRevoked]: TokensRevokedEvent;
};

export interface TokensRevokedEvent {
  token: string;
  team_id: string;
  api_app_id: string;
  event: {
    type: 'tokens_revoked';
    tokens: {
      oauth: string[];
      bot: string[];
    };
  };
  type: 'event_callback';
  event_id: string;
  event_time: number;
}
