export enum Entity {
  AuthToken = 'AuthToken',
}

export interface AuthToken {
  token: string;
  /**
   * Timestamp in miliseconds
   */
  expiresAt: number;
  refreshToken: string;
  environmentId: string;
  spaceId: string;
  installationUuid?: string;
  slackWorkspaceId: string;
}

export interface SpaceEnvironmentContext {
  spaceId: string;
  environmentId: string;
}
