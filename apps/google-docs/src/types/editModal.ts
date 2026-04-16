import type { SourceRef } from './entryBlockGraph';

export interface EditLocationOption {
  id: string;
  contentTypeId: string;
  contentTypeName: string;
  entryName: string;
  fieldId: string;
  fieldName: string;
  fieldType: string;
  sourceRef: SourceRef;
  isSelected?: boolean;
}

export interface EditModalNewLocation {
  title: string;
}

export interface EditModalContent {
  selectedText: string;
  isOpen: boolean;
  currentLocations: EditLocationOption[];
  newLocations?: EditModalNewLocation[];
}
