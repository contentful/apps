import { SidebarAppSDK } from '@contentful/app-sdk';

type UploadVideoOptions = {
  title?: string;
  fileName?: string;
  locale?: string;
  contentType?: string;
};

export const uploadVideoAsset = async (
  sdk: SidebarAppSDK,
  videoBlob: Blob,
  options: UploadVideoOptions = {}
): Promise<string> => {
  const spaceId = sdk.ids.space;
  const environmentId = sdk.ids.environment;

  if (!spaceId || !environmentId) {
    throw new Error('Space or environment ID is unavailable.');
  }

  const locale = options.locale ?? sdk.locales.default;
  const entryId = sdk.ids.entry ?? 'entry';
  const title = options.title ?? `Broadcast Video - ${entryId}`;
  const fileName = options.fileName ?? `broadcast-${entryId}.mp4`;
  const contentType = options.contentType ?? (videoBlob.type || 'video/mp4');

  const upload = await sdk.cma.upload.create(
    {
      spaceId,
      environmentId,
    },
    { file: videoBlob }
  );

  const asset = await sdk.cma.asset.create(
    {
      spaceId,
      environmentId,
    },
    {
      fields: {
        title: {
          [locale]: title,
        },
        file: {
          [locale]: {
            contentType,
            fileName,
            uploadFrom: {
              sys: {
                type: 'Link',
                linkType: 'Upload',
                id: upload.sys.id,
              },
            },
          },
        },
      },
    }
  );

  const processedAsset = await sdk.cma.asset.processForAllLocales(
    {
      spaceId,
      environmentId,
    },
    asset
  );

  const publishedAsset = await sdk.cma.asset.publish(
    {
      spaceId,
      environmentId,
      assetId: processedAsset.sys.id,
    },
    processedAsset
  );

  return publishedAsset.sys.id;
};
