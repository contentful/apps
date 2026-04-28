import type { SourceRef } from './entryBlockGraph';

export interface EditLocationOption {
  entryIndex: number;
  id: string;
  contentTypeId: string;
  contentTypeName: string;
  entryName: string;
  fieldId: string;
  fieldName: string;
  fieldType: string;
  sourceRef: SourceRef;
  sourceRefs?: SourceRef[];
  mappingKeys?: string[];
  isSelected?: boolean;
}

export interface EditModalFieldOption {
  id: string;
  fieldName: string;
  fieldDisplayType: string;
  fieldType: string;
  isAssetField?: boolean;
}

export interface EditModalFieldMapping {
  fieldId: string;
  sourceRefs: SourceRef[];
}

export interface EditModalNewLocation {
  id: string;
  title: string;
  fieldOptions: EditModalFieldOption[];
  fieldMappings: EditModalFieldMapping[];
  selectedFieldIds?: string[];
}

export interface EditModalContent {
  selectedText: string;
  /** Mapped-only preview for exclude flow; falls back to selectedText in the modal when absent. */
  contentPreview?: string;
  /** Replaces the default "Selected content" heading for the preview card. */
  previewSectionTitle?: string;
  isOpen: boolean;
  currentLocations: EditLocationOption[];
  newLocation: EditModalNewLocation;
}
