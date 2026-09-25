export interface EditorInterfaceConfiguration {
  sidebar?: { position: number };
  editors?: { position: number };
}

export type EditorInterfaceState = Record<string, EditorInterfaceConfiguration>;

export const buildEditorInterfaceTargetState = (
  currentEditorInterface: EditorInterfaceState = {},
  selectedContentTypeIds: string[]
): EditorInterfaceState => {
  return selectedContentTypeIds.reduce<EditorInterfaceState>((nextState, contentTypeId) => {
    const existingConfiguration = currentEditorInterface[contentTypeId] ?? {};

    nextState[contentTypeId] = {
      ...existingConfiguration,
      sidebar: existingConfiguration.sidebar ?? { position: 1 },
    };

    return nextState;
  }, {});
};
