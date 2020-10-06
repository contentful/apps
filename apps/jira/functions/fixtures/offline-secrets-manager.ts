import {SecretsManager} from "aws-sdk";

export const offlineSecretsManager = {
  getSecretValue() {
    return {
      promise() {
        return Promise.resolve({
          SecretString: JSON.stringify({
            clientId: process.env.ATLASSIAN_APP_CLIENT_ID,
            clientSecret: process.env.ATLASSIAN_APP_CLIENT_SECRET
          })
        })
      }
    }
  }
} as unknown as SecretsManager