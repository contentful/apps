import { z } from 'zod';

// Schema Definitions for the Document Parser Agent

// Schema for a single field value in Contentful format (locale-specific)
// Contentful expects fields in format: { 'en-US': value }
const LocalizedFieldSchema = z.record(z.string(), z.any());

// Schema for a single entry that will be created in Contentful
export const EntryToCreateSchema = z.object({
  contentTypeId: z.string().describe('The ID of the content type for this entry'),
  fields: z
    .record(z.string(), LocalizedFieldSchema)
    .describe(
      'Fields with localized values, e.g., { "title": { "en-US": "My Title" }, "body": { "en-US": "Content..." } }'
    ),
});

// The final output schema - array of entries ready for CMA client
export const FinalEntriesResultSchema = z.object({
  entries: z
    .array(EntryToCreateSchema)
    .describe('Array of entries extracted from the document, ready to be created in Contentful'),
  summary: z.string().describe('Brief summary of what was extracted from the document'),
  totalEntries: z.number().describe('Total number of entries extracted'),
});

export type EntryToCreate = z.infer<typeof EntryToCreateSchema>;
export type FinalEntriesResult = z.infer<typeof FinalEntriesResultSchema>;
