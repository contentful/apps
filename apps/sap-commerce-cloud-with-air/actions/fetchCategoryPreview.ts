import { get, difference } from 'lodash';
import { Hash, ConfigurationParameters, Category } from '../src/interfaces';
import { fields } from './constants';

interface AppActionCallParameters {
  apiKey: string;
  sapApiEndpoint: string;
  categories: string;
}

export const handler = async (payload: AppActionCallParameters) => {
  const { sapApiEndpoint, apiKey, categories } = payload;
  try {
    const parsedCategories = JSON.parse(categories);
    const req = await fetch(`${sapApiEndpoint}/products?fields=${fields.join(',')}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'application-interface-key': apiKey,
      },
    });

    const json = await req.json();

    const validCategoryIDRegex = /^[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/;
    const validIds = parsedCategories.filter((id) => validCategoryIDRegex.test(id));
    const invalidIds = difference(parsedCategories, validIds);

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

    const foundCategories = json.body.results.map(
      categoryTransformer({
        projectKey: '',
        locale: '',
      })
    );

    const missingCategories = [
      ...difference(
        validIds,
        foundCategories.map((category) => category.id)
      ),
      ...invalidIds,
    ].map((id) => ({ id, name: '', slug: '', isMissing: true }));

    return {
      status: 'Success',
      categories: [...foundCategories, ...missingCategories],
    };
  } catch (err) {
    return {
      status: 'Failed',
      body: err.message,
    };
  }
};

export const categoryTransformer =
  ({ projectKey, locale }: ConfigurationParameters) =>
  (item: Hash): Category => {
    const id = get(item, ['id'], '');
    const externalLink =
      (projectKey && id && `https://mc.commercetools.com/${projectKey}/categories/${id}/general`) ||
      '';
    return {
      id,
      name: get(item, ['name', locale === undefined ? '' : locale], ''),
      slug: get(item, ['slug', locale === undefined ? '' : locale], ''),
      isMissing: false,
      sku: '',
      image: '',
      externalLink,
    };
  };
