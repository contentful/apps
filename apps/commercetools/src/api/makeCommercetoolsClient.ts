import { Hash } from "./../interfaces";
import { createClient } from "@commercetools/sdk-client";
import { createAuthMiddlewareForClientCredentialsFlow } from "@commercetools/sdk-middleware-auth";
import { createHttpMiddleware } from "@commercetools/sdk-middleware-http";
import { createQueueMiddleware } from "@commercetools/sdk-middleware-queue";

let commercetoolsClient: any = null;

export function makeCommerceToolsClient({
  parameters: {
    installation: {
      apiEndpoint,
      authApiEndpoint,
      projectKey,
      clientId,
      clientSecret
    }
  }
}: Hash) {
  if (commercetoolsClient) {
    return commercetoolsClient;
  }

  const authMiddleware = createAuthMiddlewareForClientCredentialsFlow({
    host: authApiEndpoint,
    projectKey: projectKey,
    credentials: {
      clientId: clientId,
      clientSecret: clientSecret
    }
  });

  const httpMiddleware = createHttpMiddleware({
    host: apiEndpoint
  });

  const queueMiddleware = createQueueMiddleware({
    concurrency: 5
  });

  commercetoolsClient = createClient({
    middlewares: [authMiddleware, httpMiddleware, queueMiddleware]
  });

  return commercetoolsClient;
}
