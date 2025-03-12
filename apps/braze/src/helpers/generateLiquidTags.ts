import {EntryArrayField, Field} from './assembleQuery';
import {ASSET_FIELDS, LOCATION_LAT, LOCATION_LONG, SAVED_RESPONSE} from './utils';

export default function generateLiquidTags(prefix: string, fields: Field[]): string[] {
  const liquidTags: string[] = [];

  console.log("Fields", fields);

  fields.forEach((field, index) => {
    const content = `${SAVED_RESPONSE}.data.${prefix}.${field.id}`;

    if (field.type !== 'RichText') {
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
        if (field.arrayType === 'Entry') {
          pushEntryArrayLiquidTag(field, prefix, liquidTags);
        } else if (field.arrayType === 'Asset') {
          liquidTags.push(...generateAssetArrayLiquidTag(content, index));
        } else if (field.arrayType === 'Symbol') {
          liquidTags.push(generateTextArrayLiquidTag(content));
        }
      } else {
        liquidTags.push(`{{${content}}}`);
      }
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

function pushEntryArrayLiquidTag(field: EntryArrayField, prefix: string, liquidTags: string[]) {
  field.items.map(({fields}, index) => {
    const entryArrayPrefix = `${prefix}.${field.id}Collection.items[${index}]`;
    liquidTags.push(...generateLiquidTags(entryArrayPrefix, fields));
  });
}

function generateAssetArrayLiquidTag(content: string, index: number) {
  return generateLiquidAssetFields(`${content}Collection.items[${index}]`);
}

function generateTextArrayLiquidTag(content: string) {
  return `{{${content}Collection}}`;
}