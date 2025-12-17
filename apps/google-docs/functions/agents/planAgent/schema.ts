import { z } from 'zod';

// Schema Definitions for the Plan Agent

/**
 * Represents a reference field in a content type
 */
export const ReferenceFieldSchema = z.object({
  fieldId: z.string().describe('The ID of the reference field'),
  fieldName: z.string().describe('Human-readable name of the field'),
  linkType: z.enum(['Entry', 'Asset']).describe('Type of link'),
  validations: z.any().optional().describe('Field validations (e.g., linkContentType)'),
});

/**
 * Represents a relationship between two content types
 */
export const ContentTypeRelationshipSchema = z.object({
  sourceContentTypeId: z.string().describe('Content type that has the reference field'),
  sourceContentTypeName: z.string().describe('Human-readable name of source content type'),
  targetContentTypeId: z.string().describe('Content type being referenced'),
  targetContentTypeName: z.string().describe('Human-readable name of target content type'),
  fieldId: z.string().describe('The reference field ID'),
  fieldName: z.string().describe('Human-readable field name'),
  relationType: z.enum(['single', 'many']).describe('Single reference or array'),
  isInSelectedSet: z.boolean().describe('Whether the target content type is in the selected set'),
});

/**
 * Summary of a content type for visualization
 */
export const ContentTypeSummarySchema = z.object({
  contentTypeId: z.string().describe('The content type ID'),
  contentTypeName: z.string().describe('Human-readable name'),
  description: z.string().optional().describe('Content type description'),
  totalFields: z.number().describe('Total number of fields'),
  referenceFields: z.array(ReferenceFieldSchema).describe('Fields that reference other entries'),
  hasIncomingReferences: z.boolean().describe('Whether other content types reference this one'),
  hasOutgoingReferences: z.boolean().describe('Whether this content type references others'),
});

/**
 * The complete relationship analysis output schema
 */
export const ContentTypeRelationshipAnalysisSchema = z.object({
  contentTypes: z.array(ContentTypeSummarySchema).describe('Summary of each selected content type'),
  relationships: z
    .array(ContentTypeRelationshipSchema)
    .describe('All relationships between the selected content types'),
  summary: z.string().describe('Brief summary of the content types and their relationships'),
  totalContentTypes: z.number().describe('Total number of content types'),
  totalRelationships: z.number().describe('Total number of relationships'),
});

export type ReferenceField = z.infer<typeof ReferenceFieldSchema>;
export type ContentTypeRelationship = z.infer<typeof ContentTypeRelationshipSchema>;
export type ContentTypeSummary = z.infer<typeof ContentTypeSummarySchema>;
export type ContentTypeRelationshipAnalysis = z.infer<typeof ContentTypeRelationshipAnalysisSchema>;
