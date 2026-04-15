import type { SourceRef } from './entryBlockGraph';

export interface EditLocationOption {
  id: string;
  contentTypeId: string;
  entryName: string;
  fieldId: string;
  fieldName: string;
  fieldType: string;
  sourceRef: SourceRef;
  isSelected?: boolean;
}

export interface EditModalContent {
  selectedText: string;
  locations: EditLocationOption[];
}
