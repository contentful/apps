import { Field } from '../dialogaux';

export default function generateLiquidTags(contentTypeId: string, field: Field) {
  return `{{response.data.${contentTypeId}.${field.id}}}`;
}
