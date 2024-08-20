import { BaseSites } from '../types';
import { AIR_HEADER } from '../constants';
import { baseSiteTransformer } from '../../../frontend/src/api/dataTransformers';

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
}
