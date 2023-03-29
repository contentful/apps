import { baseSiteTransformer } from './dataTransformers';

export async function fetchBaseSites(
  config: any,
  applicationInterfaceKey: string
): Promise<string[]> {
  const url = `${config.installation.apiEndpoint}/occ/v2/basesites`;
  try {
    const response = await fetch(url, {
      headers: {
        'Application-Interface-Key': applicationInterfaceKey,
      },
    });
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
