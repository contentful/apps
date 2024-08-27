import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse } from '../types';
import { withAsyncAppActionErrorHandling } from '../helpers/error-handling';
import { fetchApiEndpoint } from '../helpers/fetchApiEndpoint';
import { SapService } from '../services/sapService';

export const handler = withAsyncAppActionErrorHandling(
  async (_payload: {}, context: AppActionCallContext): Promise<AppActionCallResponse<string[]>> => {
    const {
      cma,
      appActionCallContext: { appInstallationId },
    } = context;
    const apiEndpoint = await fetchApiEndpoint(cma, appInstallationId);

    const sapService = new SapService(apiEndpoint);
    const baseSites = await sapService.getBaseSites();

    return {
      ok: true,
      data: baseSites,
    };
  }
);
