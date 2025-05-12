import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { FieldData } from '../config/klaviyo';
import logger from './logger';

/**
 * Retrieves detailed information about a field
 * @param fieldId The ID of the field
 * @param isAsset Whether the field is an asset type
 * @param sdk The Contentful SDK
 * @returns Field data object with details
 */
export const getFieldDetails = async (
  fieldId: string,
  isAsset: boolean,
  sdk: SidebarExtensionSDK
): Promise<FieldData> => {
  try {
    // Get content type to find field metadata
    const contentType = await sdk.space.getContentType(sdk.ids.contentType);
    const fieldDef = contentType.fields.find((f) => f.id === fieldId);

    if (!fieldDef) {
      throw new Error(`Field definition not found for field ID: ${fieldId}`);
    }

    // Get current field value
    const fieldValue = sdk.entry.fields[fieldId]?.getValue();

    // Basic field metadata
    const fieldData: FieldData = {
      id: fieldId,
      name: fieldDef.name,
      type: fieldDef.type,
      value: fieldValue,
      isAsset: isAsset,
      contentTypeId: sdk.ids.contentType,
    };

    // Handle asset fields differently
    if (isAsset && fieldValue) {
      try {
        // For asset fields, we need to get the asset details
        if (Array.isArray(fieldValue)) {
          // Handle array of assets
          const assetIds = fieldValue.map((item) => item.sys?.id).filter(Boolean);
          const assets = await Promise.all(assetIds.map((id) => sdk.space.getAsset(id)));

          fieldData.assetDetails = assets.map((asset) => ({
            id: asset.sys.id,
            title: asset.fields.title?.[sdk.locales.default] || '',
            description: asset.fields.description?.[sdk.locales.default] || '',
            url: asset.fields.file?.[sdk.locales.default]?.url || '',
            fileName: asset.fields.file?.[sdk.locales.default]?.fileName || '',
            contentType: asset.fields.file?.[sdk.locales.default]?.contentType || '',
          }));
        } else if (fieldValue && fieldValue.sys && fieldValue.sys.id) {
          // Handle single asset
          const asset = await sdk.space.getAsset(fieldValue.sys.id);

          fieldData.assetDetails = [
            {
              id: asset.sys.id,
              title: asset.fields.title?.[sdk.locales.default] || '',
              description: asset.fields.description?.[sdk.locales.default] || '',
              url: asset.fields.file?.[sdk.locales.default]?.url || '',
              fileName: asset.fields.file?.[sdk.locales.default]?.fileName || '',
              contentType: asset.fields.file?.[sdk.locales.default]?.contentType || '',
            },
          ];
        }
      } catch (assetError) {
        logger.error('Error getting asset details:', assetError);
      }
    }

    return fieldData;
  } catch (error) {
    logger.error(`Error getting field details for ${fieldId}:`, error);
    // Return minimal field data on error
    return {
      id: fieldId,
      name: fieldId,
      type: 'Unknown',
      value: null,
      isAsset: isAsset,
      contentTypeId: sdk.ids.contentType,
    };
  }
};
