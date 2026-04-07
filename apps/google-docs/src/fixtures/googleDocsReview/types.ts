export interface FixtureTextRun {
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

export interface FixtureContentBlock {
  id: string;
  position: number;
  type: 'paragraph' | 'heading' | 'listItem';
  headingLevel?: number;
  textRuns: FixtureTextRun[];
  designValueIds: string[];
  imageIds: string[];
  bullet?: {
    nestingLevel: number;
    ordered: boolean;
  };
  captionForImageId?: string;
}

export interface FixtureTableTextPart {
  id: string;
  type: 'text';
  textRuns: FixtureTextRun[];
}

export interface FixtureTableImagePart {
  id: string;
  type: 'image';
  imageId: string;
}

export type FixtureTablePart = FixtureTableTextPart | FixtureTableImagePart;

export interface FixtureTableCell {
  id: string;
  parts: FixtureTablePart[];
}

export interface FixtureTableRow {
  id: string;
  cells: FixtureTableCell[];
}

export interface FixtureTable {
  id: string;
  position: number;
  headers: string[];
  rows: FixtureTableRow[];
  designValueIds: string[];
  imageIds: string[];
}

export interface FixtureNormalizedImage {
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

export interface FixtureNormalizedDocument {
  documentId: string;
  title?: string;
  designValues?: Array<{
    id: string;
    type: string;
    value: Record<string, unknown>;
    appliesTo: string[];
  }>;
  contentBlocks: FixtureContentBlock[];
  images?: FixtureNormalizedImage[];
  tables: FixtureTable[];
  assets?: Array<{
    url: string;
    altText?: string;
    title?: string;
    fileName?: string;
    contentType?: string;
  }>;
}

export type FixtureSourceRef =
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

export interface FixtureFieldMapping {
  fieldId: string;
  fieldType: string;
  sourceRefs: FixtureSourceRef[];
  sourceEntryIds?: string[];
  confidence: number;
  transformNotes?: string;
}

export interface FixtureGraphEntry {
  contentTypeId: string;
  tempId?: string;
  fieldMappings: FixtureFieldMapping[];
}

export interface FixtureEntryBlockGraph {
  entries: FixtureGraphEntry[];
  excludedSourceRefs: FixtureSourceRef[];
}

export interface FixtureUsageItem {
  entryIndex: number;
  fieldId: string;
  fieldType: string;
  sourceRef: FixtureSourceRef;
}

export interface FixturePreviewEntry {
  tempId?: string;
  contentTypeId: string;
  fields: Record<string, unknown>;
}

export interface FixtureAsset {
  url: string;
  altText?: string;
  title?: string;
  contentType?: string;
  width?: number;
  height?: number;
  fileName?: string;
}

export interface GoogleDocsReviewFixture {
  [key: string]: unknown;
  entries: FixturePreviewEntry[];
  assets: FixtureAsset[];
  referenceGraph?: {
    edges: Array<{
      from: string;
      to: string;
      fieldId: string;
    }>;
    creationOrder: string[];
    hasCircularDependency: boolean;
    deferredFields: Array<{
      entryId?: string;
      tempId?: string;
      fieldId: string;
      reason?: string;
    }>;
  };
  originalNormalizedDocument: FixtureNormalizedDocument;
  editableNormalizedDocument: FixtureNormalizedDocument;
  entryBlockGraph: FixtureEntryBlockGraph;
}
