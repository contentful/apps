import { OauthV2AccessResponse } from '@slack/web-api';
import { SingleTableClient, SlackClient } from '../../clients';
import { NotFoundException, SlackError, UnprocessableEntityException } from '../../errors';
import { AuthToken, Entity, SpaceEnvironmentContext } from '../../interfaces';
import { ConflictException } from '../../errors/conflict';
import { getInstallationParametersFromCma } from '../../helpers/getInstallationParameters';

const ONE_MINUTE = 60 * 1_000;

export class AuthTokenRepository {
  constructor(private singleTableClient: SingleTableClient, private slackClient: SlackClient) {}

  async validate(
    code: string,
    { spaceId, environmentId }: SpaceEnvironmentContext
  ): Promise<Pick<AuthToken, 'refreshToken' | 'token' | 'slackWorkspaceId'>> {
    const accessResponse = await this.slackClient.getAuthToken(code, {
      spaceId,
      environmentId,
    }); // update with uuid stuff for redirect uri

    if (!accessResponse.refresh_token) {
      // This may happen when rotation is not enabled. Not leaking this to the customers though.
      throw new ConflictException('Unable to fetch refresh token.');
    }

    if (!accessResponse.team?.id || !accessResponse.access_token) {
      throw new SlackError('Missing or invalid Slack Workspace or Access Token ');
    }

    return {
      token: accessResponse.access_token,
      refreshToken: accessResponse.refresh_token,
      slackWorkspaceId: accessResponse.team.id,
    };
  }

  async put(
    refreshToken: string,
    { spaceId, environmentId }: SpaceEnvironmentContext,
    installationUuid: string
  ): Promise<AuthToken> {
    const accessResponse = await this.slackClient.refreshToken(refreshToken);

    const authToken = AuthTokenRepository.toDatabase(
      accessResponse,
      {
        spaceId,
        environmentId,
      },
      installationUuid || ''
    );

    await this.updateByWorkspaceId(authToken.slackWorkspaceId, authToken, installationUuid || '');

    await this.singleTableClient.put(
      Entity.AuthToken,
      installationUuid || '',
      [spaceId, environmentId],
      authToken
    );

    return authToken;
  }

  async get(workspaceId: string, context: SpaceEnvironmentContext): Promise<AuthToken> {
    const parameters = await getInstallationParametersFromCma(
      context.spaceId,
      context.environmentId
    );
    let authToken = await this.singleTableClient.get(
      Entity.AuthToken,
      parameters.installationUuid || ''
    );

    if (!authToken) {
      throw new NotFoundException('Entity could not be found');
    }

    if (AuthTokenRepository.isExpired(authToken)) {
      try {
        const refreshResponse = await this.slackClient.refreshToken(authToken.refreshToken);
        authToken = AuthTokenRepository.applyRefreshResponse(authToken, refreshResponse);
      } catch (e) {
        if (e instanceof SlackError && e.details === 'invalid_refresh_token') {
          await this.deleteByWorkspaceId(workspaceId);
        }
        throw new NotFoundException('Entity could not be found');
      }

      await this.updateByWorkspaceId(authToken.slackWorkspaceId, authToken, '1234');
    }

    return authToken;
  }

  private async updateByWorkspaceId(
    workspaceId: string,
    authToken: Pick<AuthToken, 'refreshToken' | 'expiresAt' | 'token'>,
    installationUuid: string
  ): Promise<void> {
    const authTokens = await this.singleTableClient.queryByWorkspaceId(
      Entity.AuthToken,
      workspaceId
    );

    await Promise.all(
      authTokens.map((token) => {
        const data: AuthToken = {
          ...token,
          refreshToken: authToken.refreshToken,
          expiresAt: authToken.expiresAt,
          token: authToken.token,
        };
        return this.singleTableClient.put(
          Entity.AuthToken,
          installationUuid,
          [token.spaceId, token.environmentId],
          data
        );
      })
    );
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    const authTokens = await this.singleTableClient.queryByWorkspaceId(
      Entity.AuthToken,
      workspaceId
    );

    await Promise.all(
      authTokens.map((authToken) =>
        this.singleTableClient.delete(
          Entity.AuthToken,
          AuthTokenRepository.uuid(
            authToken.spaceId,
            authToken.environmentId,
            authToken.slackWorkspaceId
          )
        )
      )
    );
  }

  private static uuid(spaceId?: string, environmentId?: string, workspaceId?: string) {
    const values = [spaceId, environmentId, workspaceId];

    if (values.some((i) => !i)) {
      throw new UnprocessableEntityException(
        `Cannot create UUID for space ${spaceId}, environment ${environmentId}, workspace ${workspaceId}`
      );
    }

    return values.join('.');
  }

  private static isExpired(authToken: AuthToken): boolean {
    return authToken.expiresAt < Date.now() - ONE_MINUTE;
  }

  private static toDatabase(
    slackTokenResponse: OauthV2AccessResponse,
    { spaceId, environmentId }: SpaceEnvironmentContext,
    installationUuid: string
  ): AuthToken {
    return {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      token: slackTokenResponse.access_token!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      refreshToken: slackTokenResponse.refresh_token!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expiresAt: Date.now() + slackTokenResponse.expires_in! * 1_000,
      spaceId,
      environmentId,
      installationUuid,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      slackWorkspaceId: slackTokenResponse.team!.id!,
    };
  }

  /**
   * When refreshing a a token, the response doesn't include all required information (e.g. `authed_user`).
   * This function only updates the props of AuthToken that actually changed to avoid issues because of missing data.
   */
  private static applyRefreshResponse(
    currentToken: AuthToken,
    slackRefreshResponse: OauthV2AccessResponse
  ): AuthToken {
    return {
      ...currentToken,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      token: slackRefreshResponse.access_token!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      refreshToken: slackRefreshResponse.refresh_token!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expiresAt: Date.now() + slackRefreshResponse.expires_in! * 1_000,
    };
  }
}
