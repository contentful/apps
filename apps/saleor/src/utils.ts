import { DisplayLabelPrefix, Identifiers, Labels } from './types';

export const getFormattedIdentifiers = (identifiers?: Identifiers) =>
  !!identifiers && identifiers?.length > 0
    ? `[${identifiers.map(identifier => `"${identifier}"`).join(', ')}]`
    : '[]';

export const extractProductsAndVariantsIdentifiers = (labels: Labels) => ({
  productIds: getFilteredIdsOfLabels(labels, DisplayLabelPrefix.productID),
  variantSkus: getFilteredIdsOfLabels(labels, DisplayLabelPrefix.variantSKU)
});

export const getFilteredIdsOfLabels = (labels: Labels, prefix: DisplayLabelPrefix): Identifiers =>
  labels
    .filter((label: string) => label.includes(prefix))
    .map((label: string) => label.replace(`${prefix}: `, ''));
