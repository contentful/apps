import difference from 'lodash.difference';
import {
  baseSiteTransformer,
  productTransformer,
} from '../../../frontend/src/api/dataTransformers';
import { AIR_HEADER, DEFAULT_FIELDS } from '../constants';
import { BaseSites, Product } from '../types';

export class SapService {
  constructor(readonly apiEndpoint: string) {}

  public async getBaseSites(): Promise<string[]> {
    const url = `${this.apiEndpoint}/occ/v2/basesites`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.buildRequestHeaders(),
    });

    await this.handleApiError(response);
    const responseBody = await response.json();
    this.assertBaseSiteResponse(responseBody);
    const baseSites = responseBody['baseSites'].map(baseSiteTransformer());
    return baseSites;
  }

  public async getProductDetails(skus: string): Promise<{ products: Product[]; status: string }> {
    try {
      const totalProducts: Product[] = [];
      const skuIds: string[] = [];
      const parsedSkus = JSON.parse(skus);
      let skuIdsToSkusMap: { [key: string]: string } = {};

      await Promise.all(
        parsedSkus.map(async (sku: string) => {
          const id = sku.split('/products/').pop() as string;
          skuIds.push(id);
          skuIdsToSkusMap[id] = sku;

          const req = await fetch(`${sku}?fields=${DEFAULT_FIELDS.join(',')}`, {
            method: 'GET',
            headers: this.buildRequestHeaders(),
          });

          if (req.ok) {
            const json = await req.json();
            this.assertProductPreviewsResponse(json);
            totalProducts.push(json);
          }
        })
      );

      const products: Product[] = totalProducts.map(
        productTransformer(
          {
            apiEndpoint: this.apiEndpoint,
          },
          skuIdsToSkusMap
        )
      );

      const foundSKUs = products.map((product) => product.sku);
      const missingProducts: Product[] = difference(skuIds, foundSKUs).map((sku) => {
        let id = sku?.split('/products/').pop() as string;
        return {
          sku: id,
          image: '',
          id: '',
          name: '',
          isMissing: true,
          productUrl: skuIdsToSkusMap[id],
        };
      });

      return { status: 'Success', products: [...products, ...missingProducts] };
    } catch (err) {
      return {
        status: 'Failed',
        // @ts-ignore
        body: err.message,
      };
    }
  }

  // basic error handling for now, could update later when we encounter SAP API errors
  private async handleApiError(response: Response): Promise<void> {
    if (response.status < 400) return;
    const errorResponse: string = await response.text();
    const { statusText } = response;
    const msg = `SAP API error: ${errorResponse} [status: ${statusText}]`;
    throw new Error(msg);
  }

  private buildRequestHeaders() {
    return {
      'Content-Type': 'application/json',
      'application-interface-key': AIR_HEADER,
    };
  }

  private assertBaseSiteResponse(value: unknown): asserts value is BaseSites {
    if (typeof value !== 'object' || !value)
      throw new TypeError('invalid type returned from SAP Commerce Cloud');
    if (!('baseSites' in value)) throw new TypeError('missing `baseSites` attribute in value');
  }

  private assertProductPreviewsResponse(value: unknown): asserts value is Product {
    if (typeof value !== 'object' || !value)
      throw new TypeError('invalid type returned from SAP Commerce Cloud');
    if (Object.hasOwn(value, 'errors')) throw new TypeError('received error response from SAP');
    if (!('code' in value)) throw new TypeError('missing `code` attribute in value');
  }
}
