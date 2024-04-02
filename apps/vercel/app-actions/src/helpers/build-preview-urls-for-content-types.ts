import { ContentTypePreviewPathSelection, VercelPreviewUrlParts, VercelProject } from '../types';
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

export const buildPreviewUrlsForContentTypes = (
  vercelProject: VercelProject,
  contentTypePreviewPaths: ContentTypePreviewPathSelection[]
): PreviewUrlsForContentTypes => {
  const previewUrlParts = constructVercelPreviewUrlParts(vercelProject);
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
