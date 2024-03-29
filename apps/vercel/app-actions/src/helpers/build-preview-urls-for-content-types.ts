import { PlainClientAPI } from 'contentful-management';
import { fetchAppInstallationParameters } from './fetch-app-installation-parameters';
import { AppInstallationContextProps } from '../types';
import { constructVercelPreviewUrlParts } from './construct-vercel-preview-url-parts';

type PreviewUrlsForContentTypes = Record<string, string>;

export const buildPreviewUrlsForContentTypes = async (
  context: AppInstallationContextProps,
  cmaClient: PlainClientAPI
): Promise<PreviewUrlsForContentTypes> => {
  const {
    contentTypePreviewPathSelections: contentTypePreviewPaths,
    vercelAccessToken,
    selectedProject: projectId,
  } = await fetchAppInstallationParameters(context, cmaClient);
  console.log(contentTypePreviewPaths, vercelAccessToken, projectId);
  const previewUrlParts = constructVercelPreviewUrlParts(vercelAccessToken, projectId);
  const apiPath = '/api/enable-draft'; // later we won't hard code this but get it from params
  return {};
};
