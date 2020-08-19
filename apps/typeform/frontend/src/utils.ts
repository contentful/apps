import get from 'lodash/get';
import {
  ContentType,
  CompatibleFields,
  Field,
  EditorInterface,
  SelectedFields,
  TypeFormParameters
} from './typings';

/** Gets the expireTime from local storage to determine if the token is expired */
export function tokenIsExpired() {
  const token = window.localStorage.getItem('token') || '';
  const expires = window.localStorage.getItem('expireTime') || '0';

  return !token || !expires || Date.now() > parseInt(expires, 10);
}

export function tokenWillExpireSoon() {
  const expires = window.localStorage.getItem('expireTime') || '0';
  const _10Minutes = 600000;

  return !expires || parseInt(expires, 10) - Date.now() <= _10Minutes;
}

export function resetLocalStorage() {
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('expireTime');
}

export function getToken() {
  return window.localStorage.getItem('token') || '';
}

export function isCompatibleField(field: Field): boolean {
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

export const isUserAuthenticated = () => {
  return window.localStorage.getItem('token') ? true : false;
};

export function validateParameters({ selectedWorkspaceId }: TypeFormParameters): string | null {
  if (typeof selectedWorkspaceId !== 'string' || !selectedWorkspaceId.length) {
    return 'Please select a valid Typeform workspace';
  }
  return null;
}
