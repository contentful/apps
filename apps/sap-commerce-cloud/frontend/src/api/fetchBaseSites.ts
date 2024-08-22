import { baseSiteTransformer } from './dataTransformers';
import { SAPParameters } from '../interfaces';
import { BaseAppSDK, CMAClient } from '@contentful/app-sdk';
import { isHAAEnabled } from '../helpers/isHAAEnabled';
import { toHAAParams } from '../helpers/toHAAParams';

async function fetchBaseSitesHAA(ids: BaseAppSDK['ids'], cma: CMAClient): Promise<string[]> {
  const { response } = await cma.appActionCall.createWithResponse(
    toHAAParams('fetchBaseSites', ids),
    { parameters: {} }
  );
  const responseJson = JSON.parse(response.body);
  return responseJson.data;
}

export async function fetchBaseSites(
  parameters: SAPParameters,
  ids: BaseAppSDK['ids'],
  cma: CMAClient
): Promise<string[]> {
  if (isHAAEnabled(ids)) {
    return fetchBaseSitesHAA(ids, cma);
  }
  const url = `${parameters.installation.apiEndpoint}/occ/v2/basesites`;

  try {
    const response = await fetch(url);
    if (response.ok) {
      const responseJson = await response.json();
      const baseSites = responseJson['baseSites'].map(baseSiteTransformer());
      return baseSites;
    }
    throw new Error(response.statusText);
  } catch (error) {
    throw error;
  }
}
