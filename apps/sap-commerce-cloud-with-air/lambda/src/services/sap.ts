import { baseSiteTransformer, productTransformer } from '../utils/utils';
import difference from 'lodash/difference';
import axios, { AxiosRequestConfig } from 'axios';

export async function getBaseSitesService(apiEndpoint: string, applicationInterfaceKey: string) {
  const url = `${apiEndpoint}/occ/v2/basesites`;
  const axiosConfig: AxiosRequestConfig = {
    headers: {
      'Application-Interface-Key': applicationInterfaceKey,
    },
  };

  const response = await axios.get(url, axiosConfig);
  const baseSites = response.data.baseSites.map(baseSiteTransformer());
  return baseSites;
}

export async function getProductListService(
  baseSites: string,
  apiEndpoint: string,
  applicationInterfaceKey: string,
  urlPathParams: string
) {
  const axiosConfig: AxiosRequestConfig = {
    headers: {
      'Application-Interface-Key': applicationInterfaceKey,
    },
  };

  const url = `${apiEndpoint}/occ/v2/${baseSites}/products/search/${urlPathParams}`;
  const response = await axios.get(url, axiosConfig);

  return response.data;
}

export async function getProductPreviewsService(
  skus: string[],
  apiEndpoint: string,
  applicationInterfaceKey: string
) {
  const axiosConfig: AxiosRequestConfig = {
    headers: {
      'Application-Interface-Key': applicationInterfaceKey,
    },
  };

  if (skus.length === 0) {
    return [];
  }

  const totalResponse = [];
  const skuIds = [];

  for (const sku of skus) {
    skuIds.push(sku.split('/products/').pop() as string);
    const url = `${sku}?fields=code,name,summary,price(formattedValue,DEFAULT),images(galleryIndex,FULL),averageRating,stock(DEFAULT),description,availableForPickup,url,numberOfReviews,manufacturer,categories(FULL),priceRange,multidimensional,configuratorType,configurable,tags`;
    const response = await axios.get(url, axiosConfig);
    totalResponse.push(response.data);
  }

  const products = totalResponse.map(productTransformer(apiEndpoint));
  const foundSKUs = products.map((product) => product.sku);
  const missingProducts = difference(skuIds, foundSKUs).map((sku) => ({
    sku: sku.split('/products/').pop(),
    image: '',
    id: '',
    name: '',
    isMissing: true,
  }));

  return [...products, ...missingProducts];
}
