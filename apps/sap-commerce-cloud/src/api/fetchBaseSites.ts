import { baseSiteTransformer } from './dataTransformers';
import { FieldExtensionSDK } from '@contentful/app-sdk';

export async function fetchBaseSites(config: any): Promise<string[]> {
  const response = await fetch(config.installation.apiEndpoint + '/occ/v2/basesites');
  if (response.ok) {
    const responseJson = await response.json();
    const baseSites = responseJson['baseSites'].map(baseSiteTransformer());
    return baseSites;
  }
  throw new Error(response.statusText);
}
