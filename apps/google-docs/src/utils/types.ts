// This file contains the types for the document scope review state, resume payload, and workflow run result.

export enum RunStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  DRAFT = 'DRAFT',
}

export interface DocumentTabProps {
  tabId: string;
  tabTitle: string;
}

export interface AgentRunMessage {
  role: string;
  content?: {
    parts?: Array<{
      type: string;
      text?: string;
    }>;
  };
}

export interface DocTabOption {
  id: string;
  title: string;
  index?: number;
}

export interface DocumentScopeSuspendPayload {
  reason?: string;
  documentId?: string;
  title?: string;
  requiresImageSelection?: boolean;
  requiresTabSelection?: boolean;
  imageCount?: number;
  inlineObjectCount?: number;
  positionedObjectCount?: number;
  tabCount?: number;
  tabs?: DocTabOption[];
}

export interface ReviewPayload {
  documentTitle?: string;
  reviewSummary?: string;
  summary?: string;
  entries?: ReviewEntry[];
  assets?: ReviewAsset[];
  unmappedBlockIds?: string[];
  normalizedDocument?: NormalizedDocument;
  rawDocJson?: GoogleDocsRawDocument;
  contentTables?: NormalizedTable[];
  referenceGraph?: ReferenceGraph;
  headingCorrections?: number;
  agentCorrections?: number;
  agentCorrectionDetails?: ReviewCorrection[];
  contentTypes?: GoogleDocsContentType[];
  mappingPlan?: MappingPlan;
  entryHierarchy?: EntryHierarchyItem[];
  [key: string]: unknown;
}

export interface WorkflowRunResult {
  status: RunStatus.PENDING_REVIEW | RunStatus.COMPLETED;
  runId: string;
  messages: AgentRunMessage[];
  suspendPayload?: DocumentScopeSuspendPayload;
  reviewPayload?: ReviewPayload;
}

export interface DocumentScopeResumePayload {
  includeImages?: boolean;
  selectedTabIds?: string[];
}

export interface TextRunStyles {
  bold?: true;
  italic?: true;
  underline?: true;
  strikethrough?: true;
  superscript?: true;
  subscript?: true;
  linkUrl?: string;
}

export interface TextRun {
  text: string;
  styles: TextRunStyles;
}

export interface NormalizedContentBlock {
  id: string;
  position: number;
  type: 'paragraph' | 'heading' | 'listItem';
  headingLevel?: number;
  bullet?: { nestingLevel: number; ordered: boolean };
  textRuns: TextRun[];
  designValueIds: string[];
  imageIds: string[];
  captionForImageId?: string;
}

export interface NormalizedImage {
  id?: string;
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

export interface NormalizedTable {
  id: string;
  position: number;
  headers: string[];
  rows: Array<{ cells: string[] }>;
  designValueIds: string[];
  imageIds: string[];
}

export interface NormalizedDocument {
  documentId: string;
  title?: string;
  designValues: Array<{
    id: string;
    type: string;
    value: Record<string, unknown>;
    appliesTo: string[];
  }>;
  contentBlocks: NormalizedContentBlock[];
  images: NormalizedImage[];
  tables: NormalizedTable[];
  assets: ReviewAsset[];
}

export interface ReviewAsset {
  url?: string;
  title?: string;
  fileName?: string;
  contentType?: string;
  [key: string]: unknown;
}

export interface ReviewEntry {
  tempId?: string;
  contentTypeId: string;
  fields: Record<string, Record<string, unknown>>;
}

export interface ReviewCorrection {
  entryIndex: number;
  fieldId: string;
  action: string;
  path?: string;
  before?: unknown;
  after?: unknown;
}

export interface ReferenceGraph {
  nodes?: Array<Record<string, unknown>>;
  edges: Array<Record<string, unknown>>;
  hasCircularDependency: boolean;
  creationOrder?: string[];
  [key: string]: unknown;
}

export interface EntryHierarchyItem {
  tempId: string;
  entryIndex: number;
  parentTempId: string | null;
  depth: number;
  childTempIds: string[];
}

export interface GoogleDocsContentTypeField {
  id: string;
  name?: string;
  type: string;
  required?: boolean;
  localized?: boolean;
  linkType?: string;
  items?: {
    type?: string;
    linkType?: string;
    validations?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
  validations?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface GoogleDocsContentType {
  sys: {
    id: string;
  };
  displayField?: string;
  name?: string;
  description?: string | null;
  fields: GoogleDocsContentTypeField[];
}

export interface FieldMapping {
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

export interface MappingEntry {
  contentTypeId: string;
  tempId?: string;
  fieldMappings: FieldMapping[];
}

export interface MappingPlan {
  entries: MappingEntry[];
  unmappedBlockIds: string[];
  summary: string;
}

export interface GoogleDocsRawTextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  link?: {
    url?: string;
  };
}

export interface GoogleDocsRawTextRun {
  content?: string;
  textStyle?: GoogleDocsRawTextStyle;
}

export interface GoogleDocsRawParagraphElement {
  textRun?: GoogleDocsRawTextRun;
  inlineObjectElement?: {
    inlineObjectId?: string;
  };
}

export interface GoogleDocsRawEmbeddedObject {
  title?: string;
  description?: string;
  imageProperties?: {
    contentUri?: string;
    sourceUri?: string;
  };
}

export interface GoogleDocsRawInlineObject {
  inlineObjectProperties?: {
    embeddedObject?: GoogleDocsRawEmbeddedObject;
  };
}

export interface GoogleDocsRawParagraph {
  elements?: GoogleDocsRawParagraphElement[];
  bullet?: {
    nestingLevel?: number;
    listId?: string;
  };
  paragraphStyle?: {
    namedStyleType?: string;
  };
}

export interface GoogleDocsRawTableCell {
  content?: GoogleDocsRawStructuralElement[];
}

export interface GoogleDocsRawTableRow {
  tableCells?: GoogleDocsRawTableCell[];
}

export interface GoogleDocsRawTable {
  tableRows?: GoogleDocsRawTableRow[];
}

export interface GoogleDocsRawStructuralElement {
  paragraph?: GoogleDocsRawParagraph;
  table?: GoogleDocsRawTable;
  sectionBreak?: Record<string, unknown>;
}

export interface GoogleDocsRawDocumentTab {
  body?: {
    content?: GoogleDocsRawStructuralElement[];
  };
  childTabs?: GoogleDocsRawDocumentTab[];
}

export interface GoogleDocsRawDocument {
  title?: string;
  body?: {
    content?: GoogleDocsRawStructuralElement[];
  };
  tabs?: GoogleDocsRawDocumentTab[];
  inlineObjects?: Record<string, GoogleDocsRawInlineObject>;
  [key: string]: unknown;
}
