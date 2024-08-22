import get from 'lodash/get';
import difference from 'lodash/difference';
import { Product, Hash, ConfigurationParameters, AppActionCallResponse } from '../types';
import { withAsyncAppActionErrorHandling } from '../helpers/error-handling';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { fetchApiEndpoint } from '../helpers/fetchApiEndpoint';
import { SapService } from '../services/sapService';

interface AppActionCallParameters {
  baseSite: string;
  skus: string;
}
export const handler = withAsyncAppActionErrorHandling(
  async (
    payload: AppActionCallParameters,
    context: AppActionCallContext
  ): Promise<AppActionCallResponse<Product[]>> => {
    const { baseSite, skus } = payload;
    const {
      cma,
      appActionCallContext: { appInstallationId },
    } = context;
    const apiEndpoint = await fetchApiEndpoint(cma, appInstallationId);

    const sapService = new SapService(apiEndpoint);
    const productResponse = await sapService.getProductDetails(baseSite, skus);

    return {
      ok: true,
      data: productResponse.products,
    };
  }
);
