import { AssetArrayField, Field } from './assembleQuery';
import { ASSET_FIELDS, LOCATION_LAT, LOCATION_LONG, SAVED_RESPONSE } from './utils';

export default function generateLiquidTags(contentTypeId: string, fields: Field[]): string[] {
  const liquidTags: string[] = [];
  const responseData = `${SAVED_RESPONSE}.data`;
  console.log(fields);

  fields.forEach((field) => {
    let content = `${responseData}.${contentTypeId}.${field.id}`;

    if (field.type === 'Link') {
      if (field.linkType === 'Asset') {
        ASSET_FIELDS.forEach((assetField) => {
          liquidTags.push(`{{${content}.${assetField}}}`);
        });
      }
      if (field.linkType === 'Entry') {
        liquidTags.push(...generateLiquidTags(contentTypeId + '.' + field.id, field.fields));
      }
    } else if (field.type === 'Location') {
      liquidTags.push(`{{${content}.${LOCATION_LAT}}}`);
      liquidTags.push(`{{${content}.${LOCATION_LONG}}}`);
    } else if (field.type === 'Array') {
    } else {
      liquidTags.push(`{{${content}}}`);
    }
  });

  return liquidTags;
}
