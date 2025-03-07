import { Field } from '../dialogaux';
import { ASSET_DESCRIPTION, ASSET_TITLE, ASSET_URL, SAVED_RESPONSE } from './utils';

export default function generateLiquidTags(contentTypeId: string, fields: Field[]): string[] {
  const liquidTags: string[] = [];
  const responseData = `${SAVED_RESPONSE}.data`;

  fields.forEach((field) => {
    let content = `${responseData}.${contentTypeId}.${field.id}`;

    if (field.type === 'Link') {
      if (field.linkType === 'Asset') {
        const assetContent = [];
        assetContent.push(`${content}.${ASSET_TITLE}`);
        assetContent.push(`${content}.${ASSET_DESCRIPTION}`);
        assetContent.push(`${content}.${ASSET_URL}`);

        assetContent.forEach((content) => {
          liquidTags.push(`{{${content}}}`);
        });
      }
    } else {
      liquidTags.push(`{{${content}}}`);
    }
  });

  return liquidTags;
}
