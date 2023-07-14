import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk';
import { ClientBuilder } from '@commercetools/sdk-client-v2';
import { ConfigurationParameters } from '../types';

export function createClient(config: ConfigurationParameters) {
  const ctpClient = new ClientBuilder()
    .withProjectKey(config.projectKey!)
    .withHttpMiddleware({
      host: config.apiEndpoint!,
    })
    .withClientCredentialsFlow({
      host: config.authApiEndpoint!,
      projectKey: config.projectKey!,
      credentials: {
        clientId: config.clientId!,
        clientSecret: config.clientSecret!,
      },
    })
    .build();

  return createApiBuilderFromCtpClient(ctpClient).withProjectKey({
    projectKey: config.projectKey!,
  });
}
