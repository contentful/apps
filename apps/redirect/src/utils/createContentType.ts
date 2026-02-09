import { ConfigAppSDK } from '@contentful/app-sdk';
import { CreateContentTypeProps } from 'contentful-management';

export const REDIRECT_CONTENT_TYPE_ID = 'redirectAppRedirect';
export const VANITY_URL_CONTENT_TYPE_ID = 'redirectAppVanityUrl';

const redirectContentTypeBody: CreateContentTypeProps = {
  name: 'Redirect',
  description: 'Content Type used by the Redirect app. Do not delete or modify manually.',
  displayField: 'title',
  fields: [
    {
      id: 'title',
      name: 'Title',
      required: true,
      localized: false,
      type: 'Symbol',
    },
    {
      id: 'redirectFromContentTypes',
      name: 'Redirect From',
      required: true,
      localized: false,
      type: 'Array',
      items: {
        type: 'Link',
        linkType: 'Entry',
      },
    },
    {
      id: 'redirectToContentTypes',
      name: 'Redirect To',
      required: true,
      localized: false,
      type: 'Array',
      items: {
        type: 'Link',
        linkType: 'Entry',
      },
    },
    {
      id: 'redirectType',
      name: 'Redirect Type',
      required: true,
      localized: false,
      type: 'Symbol',
      validations: [
        {
          in: ['Permanent (301)', 'Temporary (302)'],
        },
      ],
    },
    {
      id: 'active',
      name: 'Active',
      required: true,
      localized: false,
      type: 'Boolean',
    },
    {
      id: 'reason',
      name: 'Reason',
      required: false,
      localized: false,
      type: 'Text',
    },
  ],
};

const vanityUrlContentTypeBody: CreateContentTypeProps = {
  name: 'Vanity URL',
  description:
    'Vanity URL content type for marketing campaign URLs and branded shortcuts for the Redirect app. Do not delete or modify manually.',
  displayField: 'title',
  fields: [
    {
      id: 'title',
      name: 'Title',
      required: true,
      localized: false,
      type: 'Symbol',
    },
    {
      id: 'slug',
      name: 'Slug',
      required: true,
      localized: false,
      type: 'Symbol',
      validations: [
        {
          unique: true,
        },
        {
          regexp: {
            pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
            flags: 'i',
          },
          message: 'Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)',
        },
      ],
    },
    {
      id: 'destinationEntry',
      name: 'Destination Entry',
      required: true,
      localized: false,
      type: 'Link',
      linkType: 'Entry',
    },
    {
      id: 'expirationDate',
      name: 'Expiration Date',
      required: false,
      localized: false,
      type: 'Date',
    },
    {
      id: 'campaign',
      name: 'Campaign',
      required: false,
      localized: false,
      type: 'Symbol',
    },
    {
      id: 'description',
      name: 'Description',
      required: false,
      localized: false,
      type: 'Text',
    },
  ],
};

async function contentTypeExists(sdk: ConfigAppSDK, contentTypeId: string): Promise<boolean> {
  try {
    await sdk.cma.contentType.get({ contentTypeId });
    return true;
  } catch (error) {
    return false;
  }
}

async function createAndPublishContentType(
  sdk: ConfigAppSDK,
  contentTypeId: string,
  contentTypeBody: CreateContentTypeProps
): Promise<void> {
  if (await contentTypeExists(sdk, contentTypeId)) {
    return;
  }

  const contentTypeProps = await sdk.cma.contentType.createWithId(
    { contentTypeId },
    contentTypeBody
  );

  await sdk.cma.contentType.publish({ contentTypeId }, contentTypeProps);
}

export async function createContentTypes(
  sdk: ConfigAppSDK,
  enableVanityUrl: boolean
): Promise<void> {
  await createAndPublishContentType(sdk, REDIRECT_CONTENT_TYPE_ID, redirectContentTypeBody);

  if (enableVanityUrl) {
    await createAndPublishContentType(sdk, VANITY_URL_CONTENT_TYPE_ID, vanityUrlContentTypeBody);
  }
}
