import {SecretsManager} from 'aws-sdk'
import {offlineSecretsManager} from './fixtures/offline-secrets-manager';
import {handleConnectLambdaEvent} from './lib/connect'
import {handleLambdaHTTPEvent} from './lib/lambda'
import {handleOauthLambdaEvent} from './lib/oauth'

const secretsManager = process.env.IS_OFFLINE ? offlineSecretsManager : new SecretsManager()

export const handleOauthRequest = handleLambdaHTTPEvent(
  handleOauthLambdaEvent(secretsManager)
)
export const handleConnectJsonRequest = handleLambdaHTTPEvent(handleConnectLambdaEvent)
