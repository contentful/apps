import difference from 'lodash/difference';
import { ConfigurationParameters, Category } from '../interfaces';
//import { createRequestBuilder } from '@commercetools/api-request-builder';
//import { makeCommerceToolsClient } from './makeCommercetoolsClient';
// import { categoryTransformer } from './dataTransformers';

export async function fetchCategoryPreviews(
  ids: string[],
  config: ConfigurationParameters,
  sapApplicationInterfaceKey: string
): Promise<Category[]> {
  const validCategoryIDRegex = /^[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/;
  const validIds = ids.filter((id) => validCategoryIDRegex.test(id));
  const invalidIds = difference(ids, validIds);

  if (invalidIds.length && !validIds.length) {
    return invalidIds.map((id) => ({
      id,
      name: '',
      slug: '',
      sku: '',
      image: '',
      isMissing: true,
    }));
  }

  /*const client = makeCommerceToolsClient({
    parameters: { installation: config }
  });
  const requestBuilder = (createRequestBuilder as Function)({
    projectKey: config.projectKey
  });

  // We attempt to fetch only categories with a valid format
  // ID (as the Commercetools API returns 400 otherwise).
  // Invalid formatted IDs end up in the missing products array, together with IDs
  // that had the correct format but do not correspond anymore to any category
  const uri = requestBuilder.categories
    .where(`id in (${validIds.map(id => `"${id}"`).join(',')})`)
    .build();

  const response = await client.execute({ uri, method: 'GET' });*/

  // const response = await fetch(
  //   'https://api.c19a91jwyt-habermaas1-d1-public.model-t.cc.commerce.ondemand.com/occ/v2/jakooDE/products/' +
  //     '?fields=code,name,summary,price(formattedValue,DEFAULT),images(galleryIndex,FULL),averageRating,stock(DEFAULT),description,availableForPickup,url,numberOfReviews,manufacturer,categories(FULL),priceRange,multidimensional,configuratorType,configurable,tags&lang=de&curr=EUR'
  // );

  /*if (response.statusCode === 200) {
    const foundCategories = response.body.results.map(categoryTransformer(config));

    const missingCategories = [
      ...difference(
        validIds,
        foundCategories.map(category => category.id)
      ),
      ...invalidIds
    ].map(id => ({ id, name: '', slug: '', isMissing: true }));

    return [...foundCategories, ...missingCategories];
  }
  throw new Error(response.statusCode);*/
  return [];
}
