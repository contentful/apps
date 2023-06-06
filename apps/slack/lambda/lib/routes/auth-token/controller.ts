import { AuthTokenRepository } from './repository';
import { template } from './view';
import { assertValid, asyncHandler } from '../../utils';
import {
  getAuthTokenParametersSchema,
  GetAuthTokenParameters,
  PostAuthTokenBody,
  postAuthTokenBodySchema,
} from './validation';
import { OAuthResult } from './constants';
import { NotFoundException } from '../../errors';

export class AuthTokenController {
  constructor(private authTokenRepository: AuthTokenRepository, private frontendUrl: string) {}

  /**
   * @openapi
   * /api/oauth:
   *   get:
   *      description: |
   *        OAuth redirect route.
   *        It handles Slack OAuth callback and renders an HTML page performing
   *        client redirect (as Slack does not support 3xx as valid response).
   *      parameters:
   *        - in: query
   *          name: code
   *          description: Slack OAuth code
   *        - in: query
   *          name: spaceId
   *          description: Contentful space where Slack App is installed
   *        - in: query
   *          name: environmentId
   *          description: Contentful environment where Slack App is installed
   *      responses:
   *        422:
   *          description: Unprocessable Entity. URL query parameters are missing or invalid
   *          content:
   *            application/json:
   *              example: { "status": 422, "message": "UnprocessableEntity" }
   *
   *        200:
   *          description: OK
   */
  get = asyncHandler(async (request, response) => {
    // this is the error that gets thrown when the OAuth flow gets canceled
    if (request.query.error && request.query.error === 'access_denied') {
      const view = template(this.frontendUrl, {
        result: OAuthResult.Cancel,
      });

      response.header('content-type', 'text/html').status(200).send(view);
      return;
    }

    const { code, spaceId, environmentId } = assertValid<GetAuthTokenParameters>(
      getAuthTokenParametersSchema,
      request.query
    );

    let result, slackWorkspaceId, accessToken, refreshToken, errorMessage;
    try {
      ({
        slackWorkspaceId,
        token: accessToken,
        refreshToken,
      } = await this.authTokenRepository.validate(code, {
        spaceId,
        environmentId,
      }));
      result = OAuthResult.Ok;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      result = OAuthResult.Error;
      errorMessage = e.message;
    }

    // Slack does not accept redirects (via 3xx),
    // so we render a page which does client redirects
    const view = template(this.frontendUrl, {
      accessToken,
      refreshToken,
      state: slackWorkspaceId,
      result,
      errorMessage,
    });

    response.header('content-type', 'text/html').status(200).send(view);
  });

  /**
   * @openapi
   * /api/tokens:
   *   post:
   *      description: |
   *        Saves tokens at the end of the Contentful Slack App installation process.
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              properties:
   *                refreshToken:
   *                  type: string
   *                  description: Refresh token received from the initial OAuth response.
   *      responses:
   *        422:
   *          description: Unprocessable Entity. Body parameters are missing or invalid
   *          content:
   *            application/json:
   *              example: { "status": 422, "message": "UnprocessableEntity" }
   *        404:
   *          description: Not Found. Thrown when the request validation fails.
   *          content:
   *            application/json:
   *              example: { "status": 404, "message": "Not Found" }
   *        201:
   *          description: OK
   *          content:
   *            application/json:
   *              example: { "token": "SLACK_TOKEN" }
   */
  post = asyncHandler(async (request, response) => {
    const spaceId = request.header('x-contentful-space-id');
    const environmentId = request.header('x-contentful-environment-id');
    const installationUuid = request.header('x-contentful-uuid');

    if (!spaceId || !environmentId) {
      throw new NotFoundException();
    }
    const { refreshToken } = assertValid<PostAuthTokenBody>(postAuthTokenBodySchema, request.body);

    const { token } = await this.authTokenRepository.put(
      refreshToken,
      {
        spaceId,
        environmentId,
      },
      installationUuid
    );

    response.status(201).send({ token });
  });
}
