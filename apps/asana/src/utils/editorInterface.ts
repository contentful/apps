import type { PrimaryTaskLinkFieldMapping } from '../types';
import { getMappedPrimaryTaskLinkFieldIds } from './primaryTaskLink';

export interface EditorInterfaceConfiguration {
  sidebar?: { position: number };
  editors?: { position: number };
  controls?: Array<{ fieldId: string; settings?: Record<string, unknown> }>;
}

export type EditorInterfaceState = Record<string, EditorInterfaceConfiguration>;

export const buildEditorInterfaceTargetState = (
  currentEditorInterface: EditorInterfaceState = {},
  selectedContentTypeIds: string[],
  primaryTaskLinkMappings: Record<string, PrimaryTaskLinkFieldMapping> = {}
): EditorInterfaceState => {
  return selectedContentTypeIds.reduce<EditorInterfaceState>((nextState, contentTypeId) => {
    const existingConfiguration = currentEditorInterface[contentTypeId] ?? {};
    const mapping = primaryTaskLinkMappings[contentTypeId];
    const mappedFieldIds = getMappedPrimaryTaskLinkFieldIds(mapping);

    nextState[contentTypeId] = {
      ...existingConfiguration,
      sidebar: existingConfiguration.sidebar ?? { position: 1 },
      controls: mappedFieldIds.map((fieldId) => ({ fieldId })),
    };

    return nextState;
  }, {});
};
