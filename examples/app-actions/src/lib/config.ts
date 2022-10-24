import * as fs from 'fs';
import * as path from 'path';

const getRequiredEnvironmentVariable = (name: string) => {
  const variable = process.env[name];
  if (!variable) {
    throw new Error(
      [
        `Missing required ${name} environment variable.`,
        'Please make sure you have one in your environment or in your .env file',
      ].join('\n')
    );
  }

  return variable;
};

export const loadConfiguration = () => {
  // First things first, we need to map this code to a Contentful App.
  // You can find the AppDefinition id of your app in the App details page
  // of your app https://app.contentful.com/deeplink?link=app-definition
  const appDefinitionId = getRequiredEnvironmentVariable('APP_DEFINITION_ID');

  // Once you expose an endpoint as an AppAction, Contentful will
  // hit your APIs with signed requests. In order to verify said
  // requests, you need to provide your AppSigningSecret
  //
  // Documentation:
  // https://www.contentful.com/developers/docs/references/content-management-api/#/reference/app-signing-secret
  const signingSecret = getRequiredEnvironmentVariable('SIGNING_SECRET');

  // In this example, we will write back information to our
  // Contentful space environment. For this reason we need an
  // AppAccessToken for the Contentful Management API.
  // Said tokens can be generated by a private/public key couple.
  //
  // Documentation:
  // https://www.contentful.com/developers/docs/references/content-management-api/#/reference/app-access-token
  let privateKey;
  if (process.env.PRIVATE_KEY) {
    // Should you decide to host your key on Vercel or Netlify,
    // that takes precedence
    privateKey = process.env.PRIVATE_KEY.replace(/\\n/gm, '\n');
  } else {
    // Otherwise, we try to load it from the local file system
    const privateKeyPath = getRequiredEnvironmentVariable('PRIVATE_KEY_PATH');

    const repositoryRoot = process.cwd();
    try {
      privateKey = fs.readFileSync(path.resolve(repositoryRoot, privateKeyPath), 'utf-8');
    } catch (e) {
      throw new Error(
        [
          `Unable to read private key at ${path.resolve(repositoryRoot, privateKeyPath)}.`,
          'Please make sure the file exists.',
          `Details: ${String(e).slice(7)}`,
        ].join('\n')
      );
    }
  }

  return {
    appDefinitionId,
    signingSecret,
    privateKey,
  };
};
