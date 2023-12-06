import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { WidgetType, WidgetElementDefinition } from '../../../types/types';
import {
  ContentTypeWidgetDefs,
  FieldWidgetDefinition,
  useWidgetStore,
} from '../../../stores/widgets.store';
import { useParams } from 'react-router-dom';
import {
  ContentFields,
  ContentTypeProps,
  Control,
  EditorInterfaceProps,
  KeyValueMap,
} from 'contentful-management';
import { useCMA } from '@contentful/react-apps-toolkit';
import useSWR from 'swr';
import { ContentTypeListContext } from '../ContentTypeListContext';

interface WidgetEditorContextType {
  elements: WidgetElementDefinition[];
  selectedElement: string | null;
  editorInterface?: EditorInterfaceProps;
  setSelectedElement: (elementKey: string) => void;
  setElements: (
    elements:
      | WidgetElementDefinition[]
      | ((prevElements: WidgetElementDefinition[]) => WidgetElementDefinition[]),
    control?: Control
  ) => void;
  selectedElementObj: WidgetElementDefinition | undefined;
  setElementByKey: (key: string, element: WidgetElementDefinition) => void;
  selectedField: ContentFields<KeyValueMap> | undefined;
  selectedFieldDef: FieldWidgetDefinition | null;
  selectedContentTypeDef: ContentTypeWidgetDefs;
  selectedContentType: ContentTypeProps | undefined;
  location: 'Field' | 'Sidebar';
  isEmpty: boolean;
}

// @ts-expect-error
export const WidgetEditorContext = createContext<WidgetEditorContextType>({});

export const WidgetEditorContextProvider = ({ children }: { children: ReactNode }) => {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const { contentTypeDefs } = useWidgetStore((state) => state);
  const { allContentTypesMap } = useContext(ContentTypeListContext);
  const params = useParams();

  const selectedContentTypeDef = useMemo(() => {
    if (!params.contentTypeId) {
      throw new Error('something wrong with params');
    }
    return contentTypeDefs[params.contentTypeId];
  }, [contentTypeDefs, params.contentTypeId]);

  const selectedContentType = allContentTypesMap?.[selectedContentTypeDef.id];

  const location = useMemo(() => {
    if (params.fieldId) return 'Field';
    return 'Sidebar';
  }, [params]);

  const selectedField = useMemo(() => {
    if (selectedContentType && params.fieldId) {
      return selectedContentType.fields.find((field) => field.id === params.fieldId);
    }
  }, [selectedContentType, params.fieldId]);

  const selectedFieldDef = useMemo(() => {
    if (location !== 'Field' || !params.fieldId) return null;

    const existingField = selectedContentTypeDef.fields[params.fieldId];

    if (!existingField && !selectedField) return null;

    return {
      id: existingField?.id || selectedField?.id,
      control: existingField?.control,
      widgets: existingField?.widgets || null,
    } as FieldWidgetDefinition;
  }, [location, params.fieldId, selectedContentTypeDef, selectedField]);

  const cma = useCMA();

  const { data: editorInterface } = useSWR('editor-interfaces', () =>
    cma.editorInterface.get({ contentTypeId: selectedContentTypeDef.id })
  );

  /**
   * We derive the current elements from the global store, to have
   * a dirty state for the editor.
   * With that we only have one single source of truth, but still have the data in the context of the selected location.
   */
  const elements: WidgetElementDefinition[] = useMemo(() => {
    if (location === 'Sidebar') {
      if (!selectedContentTypeDef.sidebar?.widgets) return [];
      let sidebarWidgets = selectedContentTypeDef.sidebar.widgets;
      if (typeof sidebarWidgets === 'string') {
        sidebarWidgets = JSON.parse(sidebarWidgets);
      }
      return sidebarWidgets || [];
    }

    if (location === 'Field' && selectedFieldDef?.id) {
      let fieldWidgets = selectedContentTypeDef.fields[selectedFieldDef.id]?.widgets;
      if (!fieldWidgets) return [];
      if (typeof fieldWidgets === 'string') {
        fieldWidgets = JSON.parse(fieldWidgets);
      }

      return fieldWidgets || [];
    }
    return [];
  }, [location, selectedContentTypeDef, selectedFieldDef]);

  const selectedElementObj = useMemo(() => {
    return elements.find((el) => el.key === selectedElement);
  }, [elements, selectedElement]);

  const setElementByKey = (key: string, element: WidgetElementDefinition) => {
    const index = elements.findIndex((el) => el.key === key);
    setElements((prevElements) => {
      const copy = [...prevElements];
      copy[index] = element;
      return copy;
    });
  };

  const { setFieldWidget, setSidebarWidget } = useWidgetStore((state) => state);
  const setElements = (
    elementsSet:
      | WidgetElementDefinition[]
      | ((prevElements: WidgetElementDefinition[]) => WidgetElementDefinition[]),
    control?: Control
  ) => {
    let newElements: WidgetElementDefinition[];
    if (typeof elementsSet === 'function') {
      newElements = elementsSet(elements);
    } else {
      newElements = elementsSet;
    }

    if (location === 'Field' && selectedFieldDef) {
      let newFieldElements = [...(newElements || [])];
      if (
        newFieldElements.length === 1 &&
        newFieldElements[0].type === WidgetType.NativeFieldEditor
      ) {
        newFieldElements = [];
      }

      setFieldWidget(selectedContentTypeDef.id, {
        ...selectedFieldDef,
        control,
        widgets: newElements.length > 0 ? newFieldElements : null,
      });
    }
    if (location === 'Sidebar') {
      setSidebarWidget(selectedContentTypeDef.id, newElements.length > 0 ? newElements : undefined);
    }
  };

  const isEmpty = useMemo(() => {
    if (location === 'Sidebar') {
      return !selectedContentTypeDef.sidebar?.widgets;
    }
    return !selectedFieldDef?.widgets;
  }, [selectedContentTypeDef, selectedFieldDef, location]);

  return (
    <WidgetEditorContext.Provider
      value={{
        elements,
        setElements,
        editorInterface,
        selectedElement,
        setSelectedElement,
        selectedElementObj,
        setElementByKey,
        selectedFieldDef,
        selectedField,
        selectedContentTypeDef,
        selectedContentType,
        location,
        isEmpty,
      }}>
      {children}
    </WidgetEditorContext.Provider>
  );
};
