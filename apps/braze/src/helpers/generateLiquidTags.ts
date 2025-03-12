import { AssetArrayField, BasicArrayField, EntryArrayField, Field } from './assembleQuery';
import { ASSET_FIELDS, LOCATION_LAT, LOCATION_LONG, SAVED_RESPONSE } from './utils';

export default function generateLiquidTags(prefix: string, fields: Field[]): string[] {
  const liquidTags: string[] = [];

  fields.forEach((field) => {
    const content = `${SAVED_RESPONSE}.data.${prefix}.${field.id}`;

    if (field.type !== 'RichText') {
      if (field.type === 'Link') {
        if (field.linkType === 'Asset') {
          liquidTags.push(...generateLiquidAssetFields(content));
        }
        if (field.linkType === 'Entry') {
          liquidTags.push(...generateLiquidTags(`${prefix}.${field.id}`, field.fields));
        }
      } else if (field.type === 'Location') {
        liquidTags.push(...generateLiquidLocationFields(content));
      } else if (field.type === 'Array') {
        liquidTags.push(...generateArraysLiquidTags(field, prefix, content));
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

function generateEntryArrayLiquidTag(field: EntryArrayField, prefix: string) {
  return field.items.flatMap(({ fields }, index) => {
    const entryArrayPrefix = `${prefix}.${field.id}Collection.items[${index}]`;
    return generateLiquidTags(entryArrayPrefix, fields);
  });
}

function generateAssetArrayLiquidTag(field: AssetArrayField, content: string) {
  return [
    `{% for ${field.id}CollectionItem in ${content}Collection.items %}
{{ ${field.id}CollectionItem.title }}
{{ ${field.id}CollectionItem.description }}
{{ ${field.id}CollectionItem.url }}
{% endfor %}`,
  ];
}

function generateTextArrayLiquidTag(content: string, field: BasicArrayField) {
  return [
    `{% for ${field.id}Item in ${content} %}
{{ ${field.id}Item }}
{% endfor %}`,
  ];
}

function generateArraysLiquidTags(
  field: BasicArrayField | AssetArrayField | EntryArrayField,
  prefix: string,
  content: string
): string[] {
  if (field.arrayType === 'Entry') {
    return generateEntryArrayLiquidTag(field, prefix);
  } else if (field.arrayType === 'Asset') {
    return generateAssetArrayLiquidTag(field, content);
  }
  return generateTextArrayLiquidTag(content, field);
}
