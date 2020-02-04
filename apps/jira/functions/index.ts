import { SecretsManager } from 'aws-sdk'
import { handleConnectLambdaEvent } from './lib/connect'
import { handleLambdaHTTPEvent } from './lib/lambda'
import { handleOauthLambdaEvent } from './lib/oauth'

export const handleOauthRequest = handleLambdaHTTPEvent(
  handleOauthLambdaEvent(new SecretsManager())
)
export const handleConnectJsonRequest = handleLambdaHTTPEvent(handleConnectLambdaEvent)
