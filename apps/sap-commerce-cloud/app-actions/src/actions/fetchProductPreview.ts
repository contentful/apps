import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { withAsyncAppActionErrorHandling } from '../helpers/error-handling';
import { fetchApiEndpoint } from '../helpers/fetchApiEndpoint';
import { SapService } from '../services/sapService';
import { AppActionCallResponse, Product } from '../types';

interface AppActionCallParameters {
  skus: string;
}
export const handler = withAsyncAppActionErrorHandling(
  async (
    payload: AppActionCallParameters,
    context: AppActionCallContext
  ): Promise<AppActionCallResponse<Product[]>> => {
    const { skus } = payload;
    const {
      cma,
      appActionCallContext: { appInstallationId },
    } = context;
    const apiEndpoint = await fetchApiEndpoint(cma, appInstallationId);

    const sapService = new SapService(apiEndpoint);
    const productResponse = await sapService.getProductDetails(skus);

    return {
      ok: true,
      data: productResponse.products,
    };
  }
);
