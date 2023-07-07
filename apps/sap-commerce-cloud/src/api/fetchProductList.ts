import { Response, SAPParameters, UpdateTotalPagesFn } from '../interfaces';
import { productTransformer } from './dataTransformers';

export async function fetchProductList(
  baseSite: string,
  searchQuery: string,
  page: number,
  parameters: SAPParameters,
  updateTotalPages: UpdateTotalPagesFn
): Promise<Response> {
  if (!baseSite.length) {
    return {
      products: [],
      errors: [],
    };
  }

  const response: any = await fetch(
    parameters.installation.apiEndpoint +
      '/occ/v2/' +
      baseSite +
      '/products/search' +
      '?query=' +
      searchQuery +
      '&fields=FULL&currentPage=' +
      page
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
