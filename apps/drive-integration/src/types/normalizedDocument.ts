export interface NormalizedDocumentTextRun {
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

export interface NormalizedDocumentFlattenedRun extends NormalizedDocumentTextRun {
  start: number;
  end: number;
}

export interface NormalizedDocumentTabBlock {
  id: string;
  position: number;
  type: 'tab';
  name: string;
}

export interface NormalizedDocumentContentBlock {
  id: string;
  position: number;
  type: 'paragraph' | 'heading' | 'listItem' | 'image';
  headingLevel?: number;
  bullet?: {
    nestingLevel: number;
    ordered: boolean;
  };
  textRuns: NormalizedDocumentTextRun[];
  flattenedTextRuns: NormalizedDocumentFlattenedRun[];
  designValueIds: string[];
  imageIds: string[];
  captionForImageId?: string;
}

export type NormalizedDocumentBlock = NormalizedDocumentContentBlock | NormalizedDocumentTabBlock;

export interface NormalizedDocumentTableTextPart {
  id: string;
  type: 'text';
  textRuns: NormalizedDocumentTextRun[];
  flattenedTextRuns: NormalizedDocumentFlattenedRun[];
}

export interface NormalizedDocumentTableImagePart {
  id: string;
  type: 'image';
  imageId: string;
}

export type NormalizedDocumentTablePart =
  | NormalizedDocumentTableTextPart
  | NormalizedDocumentTableImagePart;

export interface NormalizedDocumentTableCell {
  id: string;
  parts: NormalizedDocumentTablePart[];
}

export interface NormalizedDocumentTableRow {
  id: string;
  cells: NormalizedDocumentTableCell[];
}

export interface NormalizedDocumentTable {
  id: string;
  position: number;
  headers: string[];
  rows: NormalizedDocumentTableRow[];
  designValueIds: string[];
  imageIds: string[];
}

export interface NormalizedDocumentDesignValue {
  id: string;
  type: string;
  value: Record<string, unknown>;
  appliesTo: string[];
}

export interface NormalizedDocumentImage {
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

export interface NormalizedDocumentAsset {
  url: string;
  altText?: string;
  title?: string;
  fileName?: string;
  contentType?: string;
}

export interface NormalizedDocument {
  documentId: string;
  title?: string;
  designValues?: NormalizedDocumentDesignValue[];
  contentBlocks: NormalizedDocumentBlock[];
  images?: NormalizedDocumentImage[];
  tables: NormalizedDocumentTable[];
  assets?: NormalizedDocumentAsset[];
}
