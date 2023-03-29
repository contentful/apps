import { Response, UpdateTotalPagesFn } from '../interfaces';
import { productTransformer } from './dataTransformers';

export async function fetchProductList(
  baseSite: string,
  searchQuery: string,
  page: number,
  config: any,
  updateTotalPages: UpdateTotalPagesFn,
  applicationInterfaceKey: string
): Promise<Response> {
  if (!baseSite.length) {
    return {
      products: [],
      errors: [],
    };
  }
  const response: any = await fetch(
    config.installation.apiEndpoint +
      '/occ/v2/' +
      baseSite +
      '/products/search' +
      '?query=' +
      searchQuery +
      '&fields=FULL&currentPage=' +
      page,
    {
      headers: {
        'Application-Interface-Key': applicationInterfaceKey,
      },
    }
  );
  const responseJson = await response.json();
  if (response.ok) {
    const products = responseJson['products'].map(productTransformer(config.installation));
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
