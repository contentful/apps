import { CMAClient, EntryFieldAPI } from '@contentful/app-sdk';
import { SdkField } from './utils';

const SUPPORTED_FIELD_TYPES = [
  'Symbol',
  'Text',
  'RichText',
  'Number',
  'Integer',
  'Array',
  'Link',
  'Date',
  'Location',
];

export const processFields = async (
  fields: EntryFieldAPI[],
  cma: CMAClient,
  defaultLocale: string
) => {
  const processedFields: SdkField[] = [];

  for (const field of fields) {
    const linkType = (field as any).linkType && { linkType: (field as any).linkType };
    const items = (field as any).items && {
      items: {
        type: (field as any).items.type,
        linkType: (field as any).items.linkType,
      },
    };

    if (field.locales.length === 1) {
      const rawValue = field.getValue();
      const processedValue = await processFieldValue(cma, field, rawValue, defaultLocale);

      processedFields.push({
        type: field.type,
        id: field.id,
        uniqueId: field.id,
        name: field.name,
        ...linkType,
        ...items,
        supported: isSupported(field, processedValue),
        value: processedValue,
      });
    } else {
      for (const locale of field.locales) {
        const rawValue = field.getValue(locale);
        const processedValue = await processFieldValue(cma, field, rawValue, locale);

        processedFields.push({
          type: field.type,
          id: field.id,
          uniqueId: `${field.id}-${locale}`,
          name: field.name,
          locale: locale,
          ...linkType,
          ...items,
          supported: isSupported(field, processedValue),
          value: processedValue,
        });
      }
    }
  }

  return processedFields;
};

const isSupported = (field: EntryFieldAPI, value: any) => {
  if (field.type === 'Link') {
    if (field.linkType !== 'Asset' || !value?.contentType) return false;
    return (value.contentType as string).startsWith('image');
  } else if (field.type === 'Array') {
    return field.items.type === 'Symbol';
  }
  return SUPPORTED_FIELD_TYPES.includes(field.type);
};

const processFieldValue = async (
  cma: CMAClient,
  field: EntryFieldAPI,
  value: any,
  locale: string
): Promise<any> => {
  // Handle single asset link
  if (field.type === 'Link' && field.linkType === 'Asset' && value?.sys?.id) {
    const asset = await cma.asset.get({ assetId: value.sys.id });
    const assetFile = asset.fields.file[locale];
    return {
      url: assetFile.url,
      width: assetFile.details?.image?.width || null,
      height: assetFile.details?.image?.height || null,
      contentType: assetFile.contentType,
    };
  }

  // Return original value for non-asset fields
  return value;
};
