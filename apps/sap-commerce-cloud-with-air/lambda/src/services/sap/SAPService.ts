import { baseSiteTransformer } from '../../utils/utils';
import axios from 'axios';

export async function getApplicationKeyService() {
  // TODO: Get rid of the hardcoded url
  const url = 'https://dpqac5rkzhh4cahlgb7jby4qk40qsetg.lambda-url.us-west-2.on.aws/';
  const sapRes = await axios.get(url);
  return sapRes.data;
}

export async function getBaseSitesService(apiEndpoint: string, applicationInterfaceKey: string) {
  const url = `${apiEndpoint}/occ/v2/basesites`;
  const headers = {
    headers: {
      'Application-Interface-Key': applicationInterfaceKey,
    },
  };
  const response = await axios.get(url, headers);

  const baseSites = response.data['baseSites'].map(baseSiteTransformer());
  return baseSites;
}
