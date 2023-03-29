import { baseSiteTransformer } from './dataTransformers';
import { config } from '../config';

export async function fetchBaseSites(
  parameters: any,
  applicationInterfaceKey: string
): Promise<string[]> {
  const url = `${parameters.installation.apiEndpoint}/occ/v2/basesites`;
  const headers = config.isTestEnv
    ? {}
    : {
        headers: {
          'Application-Interface-Key': applicationInterfaceKey,
        },
      };
  try {
    const response = await fetch(url, headers);
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
