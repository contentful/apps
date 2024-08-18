import { Response, SAPParameters, UpdateTotalPagesFn } from '../interfaces';
import { productTransformer } from './dataTransformers';

interface JSONResponse {
  products: [];
  errors: [];
  pagination: {
    totalPages: number;
  };
}

interface FetchProductResponse {
  json: () => Promise<JSONResponse>;
  ok: boolean;
}

export async function fetchProductList(
  baseSite: string,
  searchQuery: string,
  page: number,
  parameters: SAPParameters,
  updateTotalPages: UpdateTotalPagesFn,
): Promise<Response> {
  if (!baseSite.length) {
    return {
      products: [],
      errors: [],
    };
  }

  const response: FetchProductResponse = await fetch(
    parameters.installation.apiEndpoint +
      '/occ/v2/' +
      baseSite +
      '/products/search' +
      '?query=' +
      searchQuery +
      '&fields=FULL&currentPage=' +
      page,
  );
  const responseJson = await response.json();
  if (response.ok) {
    const products = responseJson['products'].map(
      productTransformer(parameters.installation, {}, baseSite),
    );
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
