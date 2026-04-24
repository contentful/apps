import type { SourceRef } from './entryBlockGraph';

export interface EditLocationOption {
  entryIndex: number;
  id: string;
  contentTypeId: string;
  contentTypeName: string;
  entryName: string;
  fieldId: string;
  fieldName: string;
  displayLabel?: string;
  fieldType: string;
  sourceRef: SourceRef;
  sourceRefs?: SourceRef[];
  isSelected?: boolean;
}

export interface EditModalFieldOption {
  id: string;
  fieldName: string;
  fieldDisplayType: string;
  isAssetField?: boolean;
}

export interface EditModalFieldMapping {
  fieldId: string;
}

export interface EditModalNewLocation {
  id: string;
  title: string;
  fieldOptions: EditModalFieldOption[];
  fieldMappings: EditModalFieldMapping[];
  selectedFieldIds?: string[];
}

export enum EditModalDestinationStateKind {
  Ready = 'ready',
  MissingEntry = 'missing-entry',
  NoFields = 'no-fields',
  NoCompatibleFields = 'no-compatible-fields',
  RequiresSelection = 'requires-selection',
}

export interface EditModalDestinationState {
  kind: EditModalDestinationStateKind;
  message?: string;
}

const DEFAULT_DESTINATION_STATE_MESSAGES: Record<EditModalDestinationStateKind, string> = {
  [EditModalDestinationStateKind.Ready]: '',
  [EditModalDestinationStateKind.MissingEntry]:
    'No destination entry is available for the entry currently in view.',
  [EditModalDestinationStateKind.NoFields]:
    'The current entry does not have any destination fields available.',
  [EditModalDestinationStateKind.NoCompatibleFields]:
    'The current entry does not have any compatible destination fields for this content.',
  [EditModalDestinationStateKind.RequiresSelection]:
    'Select at least one destination field in the current entry to continue.',
};

export const createEditModalDestinationState = (
  kind: EditModalDestinationStateKind,
  message?: string
): EditModalDestinationState => ({
  kind,
  message: message ?? DEFAULT_DESTINATION_STATE_MESSAGES[kind] ?? undefined,
});

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
