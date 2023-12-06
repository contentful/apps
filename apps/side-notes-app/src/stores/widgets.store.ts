import { ContentTypeProps, Control } from 'contentful-management';
import create, { StoreApi } from 'zustand';
import { WidgetElementDefinition } from '../types/types';
import { maybeMigrateParameters } from '../migrations/migrateParams';

export interface WidgetDefinition {
  widgets: WidgetElementDefinition[] | null;
}

export interface FieldWidgetDefinition extends WidgetDefinition {
  id: string;
  control?: Control;
}

export interface ContentTypeWidgetDefs {
  id: string;
  fields: FieldDefs;
  sidebar: WidgetDefinition | null;
}

export type FieldDefs = Record<string, FieldWidgetDefinition>;
export type ContentTypesDefs = Record<string, ContentTypeWidgetDefs>;

interface useWidgetsStore {
  contentTypeDefs: ContentTypesDefs;
  addNewContentType: (contentType: ContentTypeProps) => void;
  setFieldWidget: (contentTypeId: string, field: FieldWidgetDefinition) => void;
  setSidebarWidget: (contentTypeId: string, widgets?: WidgetElementDefinition[]) => void;
  removeContentType: (contentTypeId: string) => void;
  setInitialContentTypes: (initialDefs: ContentTypesDefs) => void;
}

const createAddNewContentType =
  (set: StoreApi<useWidgetsStore>['setState']) => (contentType: ContentTypeProps) =>
    set(({ contentTypeDefs }) => ({
      contentTypeDefs: {
        ...contentTypeDefs,
        [contentType.sys.id]: {
          id: contentType.sys.id,
          fields: {},
          sidebar: null,
        },
      },
    }));

const createSetFieldWidget =
  (set: StoreApi<useWidgetsStore>['setState']) =>
  (contentTypeId: string, field: FieldWidgetDefinition) =>
    set(({ contentTypeDefs }) => {
      if (!contentTypeDefs[contentTypeId]) {
        throw new Error('Could not be added, contentType not found');
      }

      let newFields = { ...contentTypeDefs[contentTypeId].fields };

      const { id, control, widgets } = field;

      if (!widgets || widgets.length < 1) {
        delete newFields[id];
      } else {
        newFields[id] = {
          id,
          control: contentTypeDefs[contentTypeId].fields[id]?.control || control,
          widgets: widgets ?? null,
        };
      }

      return {
        contentTypeDefs: {
          ...contentTypeDefs,
          [contentTypeId]: {
            ...contentTypeDefs[contentTypeId],
            fields: newFields,
          },
        },
      };
    });

const createSetSidebarWidget =
  (set: StoreApi<useWidgetsStore>['setState']) =>
  (contentTypeId: string, widgets?: WidgetElementDefinition[]) =>
    set(({ contentTypeDefs }) => {
      if (!contentTypeDefs[contentTypeId]) {
        throw new Error('Could not be added, contentType not found');
      }
      return {
        contentTypeDefs: {
          ...contentTypeDefs,
          [contentTypeId]: {
            ...contentTypeDefs[contentTypeId],
            sidebar: {
              widgets: widgets ?? null,
            },
          },
        },
      };
    });

const createSetInitialContentTypes =
  (set: StoreApi<useWidgetsStore>['setState']) => (initialDefs: ContentTypesDefs) => {
    const defs = maybeMigrateParameters({ ...initialDefs });

    Object.keys(defs).forEach((key) => {
      const sidebarWidgets = defs[key].sidebar?.widgets;
      if (sidebarWidgets) {
        if (sidebarWidgets && typeof sidebarWidgets === 'string') {
          // @ts-expect-error is checked above
          defs[key].sidebar.widgets = JSON.parse(sidebarWidgets);
        }
      }
      Object.keys(defs[key].fields).forEach((fieldKey) => {
        const fieldWidgets = defs[key].fields[fieldKey].widgets;
        if (fieldWidgets) {
          if (fieldWidgets && typeof fieldWidgets === 'string') {
            defs[key].fields[fieldKey].widgets = JSON.parse(fieldWidgets);
          }
        }
      });
    });

    set({ contentTypeDefs: defs });
  };

const createRemoveContentType =
  (set: StoreApi<useWidgetsStore>['setState']) => (contentTypeId: string) => {
    set(({ contentTypeDefs }) => {
      const copy = { ...contentTypeDefs };
      delete copy[contentTypeId];
      return { contentTypeDefs: copy };
    });
  };

export const useWidgetStore = create<useWidgetsStore>((set) => ({
  contentTypeDefs: {},
  setInitialContentTypes: createSetInitialContentTypes(set),
  removeContentType: createRemoveContentType(set),
  setSidebarWidget: createSetSidebarWidget(set),
  setFieldWidget: createSetFieldWidget(set),
  addNewContentType: createAddNewContentType(set),
}));
