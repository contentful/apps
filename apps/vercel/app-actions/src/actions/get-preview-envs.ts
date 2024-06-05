import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import {
  AppActionCallResponse,
  ContentPreviewConfiguration,
  ContentPreviewEnvironment,
} from '../types';
import { withAsyncAppActionErrorHandling } from '../helpers/error-handling';
import { buildPreviewUrlsForContentTypes } from '../helpers/build-preview-urls-for-content-types';
import { fetchAppInstallationParameters } from '../helpers/fetch-app-installation-parameters';
import { VercelService } from '../services/vercel-service';

interface AppActionCallParameters {}

export const handler = withAsyncAppActionErrorHandling(
  async (
    _parameters: AppActionCallParameters,
    context: AppActionCallContext
  ): Promise<AppActionCallResponse<ContentPreviewEnvironment[]>> => {
    const { cma, appActionCallContext } = context;
    const envId = 'vercel-app-preview-environment';
    const {
      vercelAccessToken,
      selectedProject: vercelProjectId,
      contentTypePreviewPathSelections,
      selectedApiPath,
      teamId,
    } = await fetchAppInstallationParameters(appActionCallContext, cma);

    const vercelService = new VercelService(vercelAccessToken, teamId);
    const vercelProject = await vercelService.getProject(vercelProjectId);

    const previewUrlsByContentType = buildPreviewUrlsForContentTypes(
      vercelProject,
      contentTypePreviewPathSelections,
      selectedApiPath
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
