import { ContentTypePreviewPathSelection, VercelPreviewUrlParts, VercelProject } from '../types';
import { constructVercelPreviewUrlParts } from './construct-vercel-preview-url-parts';

type PreviewUrlsForContentTypes = Record<string, string>;

const buildPreviewUrl = (
  previewUrlParts: VercelPreviewUrlParts,
  apiPath: string,
  previewPath: string
): string => {
  const url = new URL(apiPath, previewUrlParts.origin);
  url.searchParams.set('x-vercel-protection-bypass', previewUrlParts.xVercelProtectionBypass);

  // since `url.searchParams.set` is automatically encoded, our curly brackets are not being read
  // correctly during variable interpolation on the contentful preview pages. so we have to manually
  // decode those specific values and then manually add them to the URL
  const encodedPreviewPath = encodeURIComponent(previewPath);
  const partiallyDecodedPreviewPath = decodeCurlyBrackets(encodedPreviewPath);

  return `${url.toString()}&path=${partiallyDecodedPreviewPath}`;
};

const decodeCurlyBrackets = (str: string): string => {
  return str.replaceAll(/%7B/g, '{').replaceAll(/%7D/g, '}');
};

export const buildPreviewUrlsForContentTypes = (
  vercelProject: VercelProject,
  contentTypePreviewPaths: ContentTypePreviewPathSelection[],
  apiPath: string
): PreviewUrlsForContentTypes => {
  const previewUrlParts = constructVercelPreviewUrlParts(vercelProject);
  const previewUrlsForContentTypes = contentTypePreviewPaths.reduce<PreviewUrlsForContentTypes>(
    (mapping, contentTypePreviewPath) => {
      // if a preview path is not specified we don't want to include the configuration at all
      if (!contentTypePreviewPath.previewPath.trim()) return mapping;

      return {
        ...mapping,
        [contentTypePreviewPath.contentType]: buildPreviewUrl(
          previewUrlParts,
          apiPath,
          contentTypePreviewPath.previewPath
        ),
      };
    },
    {}
  );

  return previewUrlsForContentTypes;
};
