import { z } from 'zod';

// Schema Definitions for the Document Parser Agent

// Schema for a reference placeholder - used to link entries within the same document
// These get resolved to real Contentful Link objects after all entries are created
export const ReferenceSchema = z.object({
  __ref: z.string().describe('The tempId of the entry being referenced'),
});

// Schema for a single field value in Contentful format (locale-specific)
// Contentful expects fields in format: { 'en-US': value }
// Values can be primitives, objects, arrays, or reference placeholders
const LocalizedFieldSchema = z.record(z.string(), z.any());

// Schema for a single entry that will be created in Contentful
export const EntryToCreateSchema = z.object({
  tempId: z
    .string()
    .optional()
    .describe(
      'Temporary ID for this entry, used when other entries need to reference it. Format: contentTypeId_n (e.g., author_1, tag_2)'
    ),
  contentTypeId: z.string().describe('The ID of the content type for this entry'),
  fields: z
    .record(z.string(), LocalizedFieldSchema)
    .describe(
      'Fields with localized values. For reference fields, use { __ref: "tempId" }. For array of references, use [{ __ref: "tempId1" }, { __ref: "tempId2" }]'
    ),
});

// Schema for an asset to be created in Contentful
export const AssetToCreateSchema = z.object({
  url: z.string().describe('The URL of the asset (image, video, etc.)'),
  title: z.string().optional().describe('Title for the asset'),
  altText: z.string().optional().describe('Alt text for the asset'),
  fileName: z.string().optional().describe('File name for the asset'),
  contentType: z
    .string()
    .optional()
    .describe('MIME type of the asset (e.g., image/jpeg, image/png)'),
});

// The final output schema - array of entries ready for CMA client
export const FinalEntriesResultSchema = z.object({
  entries: z
    .array(EntryToCreateSchema)
    .describe(
      'Array of entries extracted from the document. Entries that are referenced by others should come first and have tempId set.'
    ),
  assets: z
    .array(AssetToCreateSchema)
    .describe(
      'Array of assets (images, videos, etc.) found in the document that should be created in Contentful. These will be created as assets and can be referenced in entries.'
    ),
  summary: z.string().describe('Brief summary of what was extracted from the document'),
  totalEntries: z.number().describe('Total number of entries extracted'),
});

export type Reference = z.infer<typeof ReferenceSchema>;
export type EntryToCreate = z.infer<typeof EntryToCreateSchema>;
export type AssetToCreate = z.infer<typeof AssetToCreateSchema>;
export type FinalEntriesResult = z.infer<typeof FinalEntriesResultSchema>;

// Type guard to check if a value is a reference placeholder
export function isReference(value: unknown): value is Reference {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__ref' in value &&
    typeof (value as Reference).__ref === 'string'
  );
}

// Type guard to check if a value is an array of references
export function isReferenceArray(value: unknown): value is Reference[] {
  return Array.isArray(value) && value.length > 0 && value.every(isReference);
}
