import { Field } from '../dialogaux';
import { SAVED_RESPONSE } from './utils';

export default function generateLiquidTags(contentTypeId: string, fields: Field[]): string[] {
  const liquidTags: string[] = fields.map(
    (field) => `{{${SAVED_RESPONSE}.data.${contentTypeId}.${field.id}}}`
  );

  return liquidTags;
}
