import { baseSiteTransformer } from './dataTransformers';
import { SAPParameters } from '../interfaces';

export async function fetchBaseSites(parameters: SAPParameters): Promise<string[]> {
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
