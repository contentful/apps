import { z } from 'zod';

// Schema Definitions for the Content Type Parser Agent

// Each invidual CT analysis by the AI Agent output schema
export const ContentTypeAnalysisSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  purpose: z.string(),
  fieldCount: z.number(),
  keyFields: z.array(z.string()),
  recommendations: z.array(z.string()),
});

// The entire set of CT analyses by the AI Agent output schema
export const FinalContentTypesAnalysisSchema = z.object({
  contentTypes: z.array(ContentTypeAnalysisSchema),
  summary: z.string(),
  complexity: z.string(),
});

export type FinalContentTypesResultSummary = z.infer<typeof FinalContentTypesAnalysisSchema>;
