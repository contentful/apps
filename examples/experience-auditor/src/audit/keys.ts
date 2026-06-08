/** Case-insensitive, punctuation-stripped key matching shared by rules and fixes. */
export function stripNonAlpha(key: string): string {
  return key.replace(/[^a-z0-9]/gi, '');
}

export const IMAGE_KEY_HINT = /(image|photo|media|thumbnail)/i;
export const ALT_KEY_HINT = /(alt|alttext|alternativetext|a11ylabel|arialabel)/i;
export const META_KEY_HINT =
  /(metadescription|seodescription|metatitle|seotitle|opengraph|ogtitle|ogdescription)/i;
// Heading must look like a heading but NOT like SEO metadata — otherwise
// `metaTitle`/`seoTitle` would match both rules and double-count one field.
export const HEADING_KEY_HINT = /(heading|headline|^title$|pagetitle)/i;
// Matches a dedicated heading-level key (e.g. `headingLevel`, `hLevel`, `level`)
// without catching unrelated `*Level` keys like `nestingLevel` or `accessLevel`.
export const HEADING_LEVEL_HINT = /(headinglevel|hlevel|^level$)/i;
