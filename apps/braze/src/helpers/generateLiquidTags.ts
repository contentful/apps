import { Field } from './assembleQuery';
import { ASSET_FIELDS, LOCATION_LAT, LOCATION_LONG, SAVED_RESPONSE } from './utils';

export default function generateLiquidTags(prefix: string, fields: Field[]): string[] {
  const liquidTags: string[] = [];

  fields.forEach((field) => {
    const content = `${SAVED_RESPONSE}.data.${prefix}.${field.id}`;
    //TODO: make it skip generating liquid tags for rich-text fields
    if (field.type === 'Link') {
      if (field.linkType === 'Asset') {
        liquidTags.push(...generateLiquidAssetFields(content));
      }
      if (field.linkType === 'Entry') {
        // TODO : check if this works for entry within entry within entry
        liquidTags.push(...generateLiquidTags(`${prefix}.${field.id}`, field.fields));
      }
    } else if (field.type === 'Location') {
      liquidTags.push(...generateLiquidLocationFields(content));
    } else if (field.type === 'Array') {
      //TODO: refactor extract methods
      if (Array.isArray(field.items)) {
        field.items.map(({ fields }, index) => {
          const entryArrayPrefix = `${prefix}.${field.id}Collection.items[${index}]`;
          liquidTags.push(...generateLiquidTags(entryArrayPrefix, fields));
        });
      } else if (field.items.type === 'Link' && field.items.linkType === 'Asset') {
        // TODO: do something similar to entryArrays for assets and test it
      }
    } else {
      liquidTags.push(`{{${content}}}`);
    }
  });

  return liquidTags;
}
function generateLiquidAssetFields(content: string): string[] {
  return ASSET_FIELDS.map((assetField) => `{{${content}.${assetField}}}`);
}

function generateLiquidLocationFields(content: string): string[] {
  return [`{{${content}.${LOCATION_LAT}}}`, `{{${content}.${LOCATION_LONG}}}`];
}
