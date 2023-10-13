import { OauthV2AccessResponse } from '@slack/web-api';
import { SingleTableClient, SlackClient } from '../../clients';
import { NotFoundException, SlackError, UnprocessableEntityException } from '../../errors';
import { AuthToken, Entity, SpaceEnvironmentContext } from '../../interfaces';
import { ConflictException } from '../../errors/conflict';
import { getInstallationParametersFromCma } from '../../helpers/getInstallationParameters';

const ONE_MINUTE = 60 * 1_000;

export class AuthTokenRepository {
  constructor(
    private singleTableClient: SingleTableClient,
    private slackClient: SlackClient
  ) {}

  async validate(
    code: string,
    { spaceId, environmentId }: SpaceEnvironmentContext
  ): Promise<Pick<AuthToken, 'refreshToken' | 'token' | 'slackWorkspaceId'>> {
    const accessResponse = await this.slackClient.getAuthToken(code, {
      spaceId,
      environmentId,
    });

    if (!accessResponse.refresh_token) {
      // This may happen when rotation is not enabled. Not leaking this to the customers though.
      throw new ConflictException({
        errMessage: 'Unable to fetch refresh token.',
        environmentId,
        spaceId,
      });
    }

    if (!accessResponse.team?.id || !accessResponse.access_token) {
      throw new SlackError({
        errMessage: 'Missing or invalid Slack Workspace or Access Token',
        environmentId,
        spaceId,
      });
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
    installationUuid?: string
  ): Promise<AuthToken> {
    const accessResponse = await this.slackClient.refreshToken(refreshToken);

    const uuid = AuthTokenRepository.uuid(
      spaceId,
      environmentId,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      accessResponse.team!.id!
    );

    const authToken = AuthTokenRepository.toDatabase(
      accessResponse,
      {
        spaceId,
        environmentId,
      },
      installationUuid
    );

    await this.updateByWorkspaceId(authToken.slackWorkspaceId, authToken);

    await this.singleTableClient.put(
      Entity.AuthToken,
      installationUuid || uuid,
      [spaceId, installationUuid || environmentId],
      authToken
    );

    return authToken;
  }

  async get(
    workspaceId: string,
    context: SpaceEnvironmentContext,
    host: string
  ): Promise<AuthToken> {
    const spaceId = context.spaceId;
    const environmentId = context.environmentId;
    const parameters = await getInstallationParametersFromCma(spaceId, environmentId, host);
    const installationUuid = parameters.installationUuid;
    const spaceEnvUuid = AuthTokenRepository.uuid(spaceId, environmentId, workspaceId);

    // installationUuid is preferred, spaceEnvUuid is for backwards compatibility
    const possibleUuids = installationUuid || spaceEnvUuid;
    let authToken = await this.singleTableClient.get(Entity.AuthToken, possibleUuids);

    if (!authToken) {
      throw new NotFoundException({ errMessage: 'Auth token not found', environmentId, spaceId });
    }

    if (AuthTokenRepository.isExpired(authToken)) {
      try {
        const refreshResponse = await this.slackClient.refreshToken(authToken.refreshToken);
        authToken = AuthTokenRepository.applyRefreshResponse(authToken, refreshResponse);
      } catch (e) {
        if (e instanceof SlackError && e.details?.errMessage === 'invalid_refresh_token') {
          await this.deleteByWorkspaceId(workspaceId, possibleUuids);
        }
        throw new NotFoundException({ errMessage: 'Auth token expired', environmentId, spaceId });
      }

      await this.updateByWorkspaceId(authToken.slackWorkspaceId, authToken);
    }

    return authToken;
  }

  private async updateByWorkspaceId(
    workspaceId: string,
    authToken: Pick<AuthToken, 'refreshToken' | 'expiresAt' | 'token'>
  ): Promise<void> {
    const authTokens = await this.singleTableClient.queryByWorkspaceId(
      Entity.AuthToken,
      workspaceId
    );

    await Promise.all(
      authTokens.map((token) => {
        const uuid = AuthTokenRepository.uuid(
          token.spaceId,
          token.environmentId,
          token.slackWorkspaceId
        );
        const data: AuthToken = {
          ...token,
          refreshToken: authToken.refreshToken,
          expiresAt: authToken.expiresAt,
          token: authToken.token,
        };
        return this.singleTableClient.put(
          Entity.AuthToken,
          token?.installationUuid || uuid,
          [token.spaceId, token.installationUuid || token.environmentId],
          data
        );
      })
    );
  }

  async deleteByWorkspaceId(workspaceId: string, installationUuid?: string): Promise<void> {
    const authTokens = await this.singleTableClient.queryByWorkspaceId(
      Entity.AuthToken,
      workspaceId
    );

    await Promise.all(
      authTokens.map((authToken) =>
        this.singleTableClient.delete(
          Entity.AuthToken,
          installationUuid ||
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
      throw new UnprocessableEntityException({
        errMessage: `Cannot create UUID for space ${spaceId}, environment ${environmentId}, workspace ${workspaceId}`,
      });
    }

    return values.join('.');
  }

  private static isExpired(authToken: AuthToken): boolean {
    return authToken.expiresAt < Date.now() - ONE_MINUTE;
  }

  private static toDatabase(
    slackTokenResponse: OauthV2AccessResponse,
    { spaceId, environmentId }: SpaceEnvironmentContext,
    installationUuid?: string
  ): AuthToken {
    const defaultAttributes = {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      token: slackTokenResponse.access_token!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      refreshToken: slackTokenResponse.refresh_token!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expiresAt: Date.now() + slackTokenResponse.expires_in! * 1_000,
      environmentId,
      spaceId,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      slackWorkspaceId: slackTokenResponse.team!.id!,
    };

    return installationUuid ? { ...defaultAttributes, installationUuid } : defaultAttributes;
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
