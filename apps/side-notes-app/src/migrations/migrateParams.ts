import { ContentFields, ContentTypeProps, Control, KeyValueMap } from 'contentful-management';
import {
  ContentTypeWidgetDefs,
  ContentTypesDefs,
  FieldDefs,
  FieldWidgetDefinition,
  WidgetDefinition,
} from '../stores/widgets.store';

export interface FieldWidgetDefinitionOld extends WidgetDefinition {
  ref: ContentFields<KeyValueMap>;
  control?: Control;
}

export interface ContentTypeWidgetDefsOld {
  ref: ContentTypeProps;
  fields: Record<string, FieldWidgetDefinitionOld>;
  sidebar: WidgetDefinition | null;
}

const maybeMigrateFields = (fields: FieldDefs | Record<string, FieldWidgetDefinitionOld>) => {
  return Object.entries(fields || {}).reduce((result, [id, field]) => {
    if (!field.ref) {
      result[id] = field as FieldWidgetDefinition;
      return result;
    }

    result[id] = {
      id: field.ref?.id,
      control: field.control,
      widgets: field.widgets,
    };
    return result;
  }, {} as FieldDefs);
};

export const maybeMigrateParameters = (
  contentTypeDefs: ContentTypesDefs | Record<string, ContentTypeWidgetDefsOld>
) => {
  return Object.entries(contentTypeDefs || {}).reduce((result, [id, ct]) => {
    if (!ct.ref) {
      result[id] = ct as ContentTypeWidgetDefs;
      return result;
    }

    result[id] = {
      id: ct.ref?.sys.id,
      fields: maybeMigrateFields(ct.fields),
      sidebar: ct.sidebar,
    };

    return result;
  }, {} as ContentTypesDefs);
};
