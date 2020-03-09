import get from 'lodash/get';
import {
  ContentType,
  CompatibleFields,
  Field,
  EditorInterface,
  SelectedFields,
  TypeFormParameters
} from './typings';

function isCompatibleField(field: Field): boolean {
  return field.type === 'Symbol';
}

export function getCompatibleFields(contentTypes: ContentType[]): CompatibleFields {
  return contentTypes.reduce((acc, ct) => {
    return {
      ...acc,
      [ct.sys.id]: (ct.fields || []).filter(isCompatibleField)
    };
  }, {});
}

export function editorInterfacesToSelectedFields(
  eis: EditorInterface[],
  appId?: string
): SelectedFields {
  return eis.reduce((acc, ei) => {
    const ctId = get(ei, ['sys', 'contentType', 'sys', 'id']);
    const fieldIds = get(ei, ['controls'], [])
      .filter(control => control.widgetNamespace === 'app' && control.widgetId === appId)
      .map(control => control.fieldId)
      .filter(fieldId => typeof fieldId === 'string' && fieldId.length > 0);

    if (ctId && fieldIds.length > 0) {
      return { ...acc, [ctId]: fieldIds };
    } else {
      return acc;
    }
  }, {});
}

export function selectedFieldsToTargetState(
  contentTypes: ContentType[],
  selectedFields: SelectedFields
) {
  return {
    EditorInterface: contentTypes.reduce((acc, ct) => {
      const { id } = ct.sys;
      const fields = selectedFields[id] || [];
      const targetState =
        fields.length > 0 ? { controls: fields.map(fieldId => ({ fieldId })) } : {};

      return { ...acc, [id]: targetState };
    }, {})
  };
}

export function validateParamameters({
  workspaceId,
  accessToken
}: TypeFormParameters): string | null {
  if (!workspaceId.length || typeof workspaceId !== 'string') {
    return 'Workspace ID is invalid!';
  }
  if (!accessToken.length || typeof accessToken !== 'string') {
    return 'Access token is invalid!';
  }
  return null;
}
