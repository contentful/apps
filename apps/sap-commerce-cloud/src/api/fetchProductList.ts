import { Response, SAPParameters, UpdateTotalPagesFn } from '../interfaces';
import { productTransformer } from './dataTransformers';
import { config } from '../config';

export async function fetchProductList(
  baseSite: string,
  searchQuery: string,
  page: number,
  parameters: SAPParameters,
  updateTotalPages: UpdateTotalPagesFn,
  applicationInterfaceKey: string
): Promise<Response> {
  if (!baseSite.length) {
    return {
      products: [],
      errors: [],
    };
  }
  const headers = config.isTestEnv
    ? {}
    : {
        headers: {
          'Application-Interface-Key': applicationInterfaceKey,
        },
      };
  const response: any = await fetch(
    parameters.installation.apiEndpoint +
      '/occ/v2/' +
      baseSite +
      '/products/search' +
      '?query=' +
      searchQuery +
      '&fields=FULL&currentPage=' +
      page,
    headers
  );
  const responseJson = await response.json();
  if (response.ok) {
    const products = responseJson['products'].map(productTransformer(parameters.installation));
    updateTotalPages(responseJson['pagination']['totalPages']);
    if (!products.length) {
      return {
        products: [],
        errors: [
          {
            message: `Products not found for search term ${searchQuery}`,
            type: 'Not Found',
          },
        ],
      };
    }
    return { products, errors: [] };
  }
  return { products: [], errors: responseJson['errors'] };
}
