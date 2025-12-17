import { z } from 'zod';

// Schema Definitions for the Plan Agent

/**
 * Represents a content type node in the relationship graph
 */
export const ContentTypeNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().describe('Content type ID'),
    name: z.string().describe('Content type name'),
    references: z
      .array(ContentTypeNodeSchema)
      .optional()
      .describe('Content types that this one references (nested)'),
  })
);

/**
 * The simple relationship graph output schema
 */
export const ContentTypeRelationshipGraphSchema = z.object({
  graph: z
    .array(ContentTypeNodeSchema)
    .describe('Nested relationship graph showing content type hierarchy'),
  summary: z.string().describe('Brief summary of the content model'),
});

export type ContentTypeNode = {
  id: string;
  name: string;
  references?: ContentTypeNode[];
};

export type ContentTypeRelationshipGraph = z.infer<typeof ContentTypeRelationshipGraphSchema>;
