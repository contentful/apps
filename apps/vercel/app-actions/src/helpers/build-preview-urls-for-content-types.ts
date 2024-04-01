import { PlainClientAPI } from 'contentful-management';
import { fetchAppInstallationParameters } from './fetch-app-installation-parameters';
import { AppInstallationContextProps, VercelPreviewUrlParts } from '../types';
import { constructVercelPreviewUrlParts } from './construct-vercel-preview-url-parts';

type PreviewUrlsForContentTypes = Record<string, string>;

const buildPreviewUrl = (
  previewUrlParts: VercelPreviewUrlParts,
  apiPath: string,
  previewPath: string
): string => {
  const url = new URL(apiPath, previewUrlParts.origin);
  url.searchParams.set('path', previewPath);
  url.searchParams.set('x-vercel-protection-bypass', previewUrlParts.xVercelProtectionBypass);
  return url.toString();
};

export const buildPreviewUrlsForContentTypes = async (
  context: AppInstallationContextProps,
  cmaClient: PlainClientAPI
): Promise<PreviewUrlsForContentTypes> => {
  const {
    contentTypePreviewPathSelections: contentTypePreviewPaths,
    vercelAccessToken,
    selectedProject: projectId,
  } = await fetchAppInstallationParameters(context, cmaClient);
  const previewUrlParts = await constructVercelPreviewUrlParts(vercelAccessToken, projectId);
  const apiPath = '/api/enable-draft'; // later we won't hard code this but get it from params

  const previewUrlsForContentTypes = contentTypePreviewPaths.reduce<PreviewUrlsForContentTypes>(
    (mapping, contentTypePreviewPath) => ({
      ...mapping,
      [contentTypePreviewPath.contentType]: buildPreviewUrl(
        previewUrlParts,
        apiPath,
        contentTypePreviewPath.previewPath
      ),
    }),
    {}
  );

  return previewUrlsForContentTypes;
};
