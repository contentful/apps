import type { SourceRef } from './entryBlockGraph';

export interface EditionLocationOption {
  id: string;
  contentTypeId: string;
  entryName: string;
  fieldId: string;
  fieldName: string;
  fieldType: string;
  sourceRef: SourceRef;
  isSelected?: boolean;
}

export interface EditionModalContent {
  selectedText: string;
  locations: EditionLocationOption[];
}
