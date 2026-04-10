export interface ReviewTextRun {
  text: string;
  styles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    superscript?: boolean;
    subscript?: boolean;
    linkUrl?: string;
  };
}

export interface ReviewContentBlock {
  id: string;
  position: number;
  type: 'paragraph' | 'heading' | 'listItem' | 'image';
  headingLevel?: number;
  textRuns: ReviewTextRun[];
  designValueIds: string[];
  imageIds: string[];
  bullet?: {
    nestingLevel: number;
    ordered: boolean;
  };
  captionForImageId?: string;
}

export interface ReviewTableTextPart {
  id: string;
  type: 'text';
  textRuns: ReviewTextRun[];
}

export interface ReviewTableImagePart {
  id: string;
  type: 'image';
  imageId: string;
}

export type ReviewTablePart = ReviewTableTextPart | ReviewTableImagePart;

export interface ReviewTableCell {
  id: string;
  parts: ReviewTablePart[];
}

export interface ReviewTableRow {
  id: string;
  cells: ReviewTableCell[];
}

export interface ReviewTable {
  id: string;
  position: number;
  headers: string[];
  rows: ReviewTableRow[];
  designValueIds: string[];
  imageIds: string[];
}

export interface ReviewNormalizedImage {
  id: string;
  url: string;
  altText?: string;
  title?: string;
  fileName?: string;
  contentType?: string;
  width?: number;
  height?: number;
  blockId?: string;
  tableId?: string;
}

export interface ReviewNormalizedDocument {
  documentId: string;
  title?: string;
  designValues?: Array<{
    id: string;
    type: string;
    value: Record<string, unknown>;
    appliesTo: string[];
  }>;
  contentBlocks: ReviewContentBlock[];
  images?: ReviewNormalizedImage[];
  tables: ReviewTable[];
  assets?: Array<{
    url: string;
    altText?: string;
    title?: string;
    fileName?: string;
    contentType?: string;
  }>;
}

export type ReviewSourceRef =
  | {
      kind: 'blockText';
      blockId: string;
      start: number;
      end: number;
    }
  | {
      kind: 'blockImage';
      blockId: string;
      imageId: string;
    }
  | {
      kind: 'tableText';
      tableId: string;
      rowId: string;
      cellId: string;
      partId: string;
      start: number;
      end: number;
    }
  | {
      kind: 'tableImage';
      tableId: string;
      rowId: string;
      cellId: string;
      partId: string;
      imageId: string;
    };

export interface ReviewFieldMapping {
  fieldId: string;
  fieldType: string;
  sourceRefs: ReviewSourceRef[];
  sourceEntryIds?: string[];
  confidence: number;
  transformNotes?: string;
}

export interface ReviewGraphEntry {
  contentTypeId: string;
  tempId?: string;
  fieldMappings: ReviewFieldMapping[];
}

export interface ReviewEntryBlockGraph {
  entries: ReviewGraphEntry[];
  excludedSourceRefs: ReviewSourceRef[];
}

export interface ReviewUsageItem {
  entryIndex: number;
  fieldId: string;
  fieldType: string;
  sourceRef: ReviewSourceRef;
}

export interface ReviewPreviewEntry {
  tempId?: string;
  contentTypeId: string;
  fields: Record<string, unknown>;
}

export interface ReviewAsset {
  url: string;
  altText?: string;
  title?: string;
  contentType?: string;
  width?: number;
  height?: number;
  fileName?: string;
}

export interface GoogleDocsReviewData {
  [key: string]: unknown;
  entries: ReviewPreviewEntry[];
  assets: ReviewAsset[];
  referenceGraph?: {
    edges?: Array<{
      from: string;
      to: string;
      fieldId: string;
    }>;
    creationOrder?: string[];
    hasCircularDependency?: boolean;
    deferredFields?: Array<{
      entryId?: string;
      tempId?: string;
      fieldId: string;
      reason?: string;
    }>;
  };
  originalNormalizedDocument: ReviewNormalizedDocument;
  editableNormalizedDocument: ReviewNormalizedDocument;
  entryBlockGraph: ReviewEntryBlockGraph;
}
