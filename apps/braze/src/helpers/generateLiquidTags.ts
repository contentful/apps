import { Field } from './assembleQuery';
import { ASSET_FIELDS, LOCATION_LAT, LOCATION_LONG, SAVED_RESPONSE } from './utils';

export default function generateLiquidTags(contentTypeId: string, fields: Field[]): string[] {
  const liquidTags: string[] = [];
  const responseData = `${SAVED_RESPONSE}.data`;

  fields.forEach((field) => {
    console.log('Field: ', field);
    let content = `${responseData}.${contentTypeId}.${field.id}`;

    if (field.type === 'Link') {
      if (field.linkType === 'Asset') {
        ASSET_FIELDS.forEach((field) => {
          liquidTags.push(`{{${content}.${field}}}`);
        });
      }
    } else if (field.type === 'Location') {
      liquidTags.push(`{{${content}.${LOCATION_LAT}}}`);
      liquidTags.push(`{{${content}.${LOCATION_LONG}}}`);
    } else {
      liquidTags.push(`{{${content}}}`);
    }
  });

  return liquidTags;
}
