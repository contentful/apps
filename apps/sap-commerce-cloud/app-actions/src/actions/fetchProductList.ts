import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse } from '../types';
import { withAsyncAppActionErrorHandling } from '../helpers/error-handling';
import { fetchApiEndpoint } from '../helpers/fetchApiEndpoint';
import { SapService } from '../services/sapService';

interface AppActionCallParameters {
  baseSite: string;
  searchQuery: string;
  page: number;
}

export const handler = withAsyncAppActionErrorHandling(
  async (
    payload: AppActionCallParameters,
    context: AppActionCallContext
  ): Promise<AppActionCallResponse<string[]>> => {
    const { baseSite, searchQuery, page } = payload;

    const {
      cma,
      appActionCallContext: { appInstallationId },
    } = context;
    const apiEndpoint = await fetchApiEndpoint(cma, appInstallationId);

    const sapService = new SapService(apiEndpoint);
    const productList = await sapService.getProductList(baseSite, searchQuery, page);

    return {
      ok: true,
      data: productList,
    };
  }
);
