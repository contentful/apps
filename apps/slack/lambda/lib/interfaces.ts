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

  spaceId: string;
  environmentId: string;
  installationUuid: string;
  slackWorkspaceId: string;
}

export interface SpaceEnvironmentContext {
  spaceId: string;
  environmentId: string;
}
