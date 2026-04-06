export interface FixtureTextRun {
  text: string;
  styles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
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

export interface FixtureTableRow {
  cells: string[];
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

export interface FixtureFieldMapping {
  fieldId: string;
  fieldType: string;
  sourceBlockIds: string[];
  sourceTableIds: string[];
  sourceAssetIds: string[];
  sourceEntryIds?: string[];
  sourceTableRowLabel?: string;
  confidence: number;
  transformNotes?: string;
}

export interface FixtureMappingEntry {
  contentTypeId: string;
  tempId?: string;
  fieldMappings: FixtureFieldMapping[];
}

export interface FixtureMappingPlan {
  entries: FixtureMappingEntry[];
  unmappedBlockIds: string[];
  summary: string;
}

export interface FixtureUsageItem {
  entryIndex: number;
  contentTypeId: string;
  fieldId: string;
}

export interface FixturePreviewEntry {
  tempId?: string;
  contentTypeId: string;
  fields: Record<string, unknown>;
}

export interface FixtureAsset {
  placeholderId: string;
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
  unmappedBlockIds?: string[];
  summary?: string;
  normalizedDocument: FixtureNormalizedDocument;
  contentTables?: FixtureTable[];
  allTables?: FixtureTable[];
  mappingPlan: FixtureMappingPlan;
  referenceGraph?: {
    edges: Array<{
      from: string;
      to: string;
      fieldId: string;
    }>;
    creationOrder: string[];
    hasCircularDependency: boolean;
    deferredFields: Array<{
      entryId: string;
      fieldId: string;
      reason: string;
    }>;
  };
}
