export function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

export const getField = (contentType, fieldId) =>
  contentType.fields.find((field) => field.id === fieldId);

export const isCompatibleImageField = (field) => !!(field && field.linkType === 'Asset');

/**
 * Derives the associated image field ID from the focal point field ID
 * Examples:
 * - focalPoint -> image
 * - focalPointLarge -> imageLarge
 * - focalPointSomeThing -> imageSomeThing
 *
 * @param {string} focalPointFieldId - The ID of the focal point field
 * @returns {string} The derived image field ID
 */
export const deriveImageFieldId = (focalPointFieldId) => {
  // Default to 'image' if the field ID doesn't start with 'focalPoint'
  if (!focalPointFieldId.startsWith('focalPoint')) {
    return 'image';
  }
  
  // If it's exactly 'focalPoint', return 'image'
  if (focalPointFieldId === 'focalPoint') {
    return 'image';
  }
  
  // For cases like 'focalPointLarge', extract 'Large' and return 'imageLarge'
  const suffix = focalPointFieldId.substring('focalPoint'.length);
  return 'image' + suffix;
};
