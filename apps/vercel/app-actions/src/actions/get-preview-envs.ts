import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import {
  AppActionCallResponse,
  ContentPreviewConfiguration,
  ContentPreviewEnvironment,
} from '../types';
import { withAsyncAppActionErrorHandling } from '../helpers/error-handling';
import { buildPreviewUrlsForContentTypes } from '../helpers/build-preview-urls-for-content-types';

interface AppActionCallParameters {}

export const handler = withAsyncAppActionErrorHandling(
  async (
    _parameters: AppActionCallParameters,
    context: AppActionCallContext
  ): Promise<AppActionCallResponse<ContentPreviewEnvironment[]>> => {
    const { cma, appActionCallContext } = context;
    const envId = 'vercel-app-preview-environment';
    const previewUrlsByContentType = await buildPreviewUrlsForContentTypes(
      appActionCallContext,
      cma
    );
    const configurations = Object.entries(
      previewUrlsByContentType
    ).map<ContentPreviewConfiguration>(([contentType, url]) => ({
      contentType,
      enabled: true,
      example: false,
      name: '',
      url,
      contentTypeFields: [],
    }));
    return {
      ok: true,

      // for now this value is intentionally hard coded
      data: [
        {
          sys: {
            id: envId,
            version: 1,
            type: 'PreviewEnvironment',
          },
          name: 'Vercel App',
          description: 'Content preview environment provided by Vercel app',
          configurations,
          envId,
        },
      ],
    };
  }
);
