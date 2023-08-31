import { PlainClientAPI } from 'contentful-management';
import fs from 'fs';
import path from 'path';
import { getManagementToken } from '@contentful/node-apps-toolkit';
import * as contentful from 'contentful-management';

const { APP_ID, PRIVATE_APP_KEY } = process.env;

export const makeSpaceEnvClient = async (
  spaceId: string,
  environmentId: string,
  host: string
): Promise<PlainClientAPI> => {
  let privateKey = PRIVATE_APP_KEY as string;
  if (privateKey.endsWith('.pem')) {
    privateKey = fs.readFileSync(path.join(__dirname, '../../../', privateKey), {
      encoding: 'utf8',
    });
  }

  const appAccessToken = await getManagementToken(privateKey, {
    appInstallationId: APP_ID as string,
    spaceId,
    environmentId,
    host,
  });

  return contentful.createClient(
    {
      accessToken: appAccessToken,
      host,
    },
    {
      type: 'plain',
      defaults: {
        spaceId,
        environmentId,
      },
    }
  );
};
