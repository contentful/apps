import { Field } from '../dialogaux';
import {ASSET_FIELDS, LOCATION_LAT, LOCATION_LONG, SAVED_RESPONSE} from './utils';
import {BaseField} from "./field/baseField";

export default function generateLiquidTags(contentTypeId: string, fields: Field[]): string[] {
  const liquidTags: string[] = [];
  const responseData = `${SAVED_RESPONSE}.data`;

  fields.forEach((field) => {
    let content = `${responseData}.${contentTypeId}.${field.id}`;

    if (field.type === 'Link') {
      if (field.linkType === 'Asset') {
        ASSET_FIELDS.forEach(field => {
          liquidTags.push(`{{${content}.${field}}}`);
        })
      }
      if (field.linkType === 'Entry') {
        field.fields.forEach(field => {
          liquidTags.push(`{{${content}.${field.id}}}`);
        })
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

export function generateLiquidTags2(contentTypeId: string, fields: BaseField[]): string[] {
  const responseData = `${SAVED_RESPONSE}.data`;

  return fields.flatMap((field) => field.toLiquidTag(contentTypeId, responseData));
}
