import { makeProxyEvent } from '../fixtures/proxy-event'
import { handleOauthLambdaEvent } from './oauth'

import * as chai from 'chai'
import * as sinonChai from 'sinon-chai'

import { APIGatewayProxyEvent } from 'aws-lambda'
import { SecretsManager } from 'aws-sdk'
import * as nock from 'nock'
import { stubInterface } from 'ts-sinon'
import { HTTPResponse } from './lambda'

chai.use(sinonChai)
const expect = chai.expect

describe('OAuth resource', () => {
  const tokenExchangeBasePath = 'http://mocked'
  const frontendUrl = 'http://frontend'
  const tokenExchangeResource = '/token'
  const tokenExchangeEndpoint = tokenExchangeBasePath + tokenExchangeResource
  const credentialsSecretId = 'secretid'
  let handler: (event: APIGatewayProxyEvent) => Promise<HTTPResponse>
  let smClientMock: any

  const oauthCredentials = {
    clientId: 'clientId',
    clientSecret: 'clientSecret'
  }

  beforeEach(() => {
    process.env.OAUTH_CREDENTIALS_SECRET_ID = credentialsSecretId
    process.env.OAUTH_REDIRECT_URI = 'redirecturi'
    process.env.OAUTH_TOKEN_EXCHANGE_ENDPOINT = tokenExchangeEndpoint
    process.env.FRONTEND_URL = frontendUrl

    // tslint:disable-next-line:deprecation
    smClientMock = stubInterface<SecretsManager>()
    handler = handleOauthLambdaEvent(smClientMock)

    smClientMock.getSecretValue.returns({
      promise: () =>
        Promise.resolve({
          SecretString: JSON.stringify(oauthCredentials)
        })
    })
  })

  it('should return a token for a valid code', async () => {
    nock(tokenExchangeBasePath)
      .post(tokenExchangeResource, {
        grant_type: 'authorization_code',
        client_id: oauthCredentials.clientId,
        client_secret: oauthCredentials.clientSecret,
        code: 'code-to-exchange',
        redirect_uri: 'redirecturi'
      })
      .reply(200, {
        access_token: 'access_token',
        expires_in: 3200,
        refresh_token: 'refresh_token'
      })

    const result = await handler(
      makeProxyEvent({
        code: 'code-to-exchange'
      })
    )

    expect(result).to.eql({
      statusCode: 302,
      headers: {
        Location: frontendUrl + '?token=access_token&expiresIn=3200'
      }
    })

    expect(smClientMock.getSecretValue).to.have.been.calledWith({
      SecretId: credentialsSecretId
    })
  })

  it('should fail with 403 if the request to atlassian fails', async () => {
    nock(tokenExchangeBasePath)
      .post(tokenExchangeResource, {
        grant_type: 'authorization_code',
        client_id: oauthCredentials.clientId,
        client_secret: oauthCredentials.clientSecret,
        code: 'code-to-exchange',
        redirect_uri: 'redirecturi'
      })
      .reply(403, {
        error: 'invalid_grant',
        error_description: 'Invalid authorization code'
      })

    const result = await handler(
      makeProxyEvent({
        code: 'code-to-exchange'
      })
    )

    expect(result.statusCode).to.eql(302)
    expect(result.headers!.Location.startsWith(frontendUrl)).to.eql(true)
  })

  it('should return 400 if no code is supplied', async () => {
    const result = await handler(makeProxyEvent({}))

    expect(result.statusCode).to.eql(302)
    expect(result.headers!.Location.startsWith(frontendUrl)).to.eql(true)
  })

  it('should throw if a configuration variable is not set', async () => {
    delete process.env.OAUTH_TOKEN_EXCHANGE_ENDPOINT

    try {
      await handler(makeProxyEvent({ code: '1234' }))
      expect(true, 'Did not throw as expected').to.eql(false)
    } catch (err) {
      expect(err.message).to.eql('OAUTH_TOKEN_EXCHANGE_ENDPOINT environment variable must be set')
    }
  })
})
