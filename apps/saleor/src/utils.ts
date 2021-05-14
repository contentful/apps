import { DisplayLabelPrefix, Identifiers, Labels } from './types';

export const getFormattedIdentifiers = (identifiers?: Identifiers) =>
  !!identifiers && identifiers?.length > 0
    ? `[${identifiers.map(identifier => `"${identifier}"`).join(', ')}]`
    : '[]';

export const extractProductsAndVariantsIdentifiers = (labels: Labels) => ({
  productIds: getFilteredIdsOfLabels(labels, DisplayLabelPrefix.ProductID),
  variantSkus: getFilteredIdsOfLabels(labels, DisplayLabelPrefix.VariantSKU)
});

export const getFilteredIdsOfLabels = (labels: Labels, prefix: DisplayLabelPrefix): Identifiers =>
  labels
    .filter((label: string) => label.includes(prefix))
    .map((label: string) => label.replace(`${prefix}: `, ''));
