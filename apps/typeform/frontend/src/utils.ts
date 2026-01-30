import get from 'lodash/get';
import {
  ContentType,
  CompatibleFields,
  Field,
  EditorInterface,
  SelectedFields,
  TypeFormParameters,
} from './typings';

/** Gets the expireTime from local storage to determine if the token is expired */
export function tokenIsExpired(baseUrl?: string) {
  const token = getToken(baseUrl);
  const expires = baseUrl
    ? window.localStorage.getItem(`expireTime_${baseUrl}`) || '0'
    : window.localStorage.getItem('expireTime') || '0';

  return !token || !expires || Date.now() > parseInt(expires, 10);
}

export function tokenWillExpireSoon(baseUrl?: string) {
  const expires = baseUrl
    ? window.localStorage.getItem(`expireTime_${baseUrl}`) || '0'
    : window.localStorage.getItem('expireTime') || '0';
  const _10Minutes = 600000;

  return !expires || parseInt(expires, 10) - Date.now() <= _10Minutes;
}

export function resetLocalStorage(baseUrl?: string) {
  if (baseUrl) {
    window.localStorage.removeItem(`token_${baseUrl}`);
    window.localStorage.removeItem(`expireTime_${baseUrl}`);
  } else {
    // Clear all tokens (for backward compatibility)
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('expireTime');
    // Clear all region-specific tokens
    Object.keys(window.localStorage).forEach((key) => {
      if (key.startsWith('token_') || key.startsWith('expireTime_')) {
        window.localStorage.removeItem(key);
      }
    });
  }
}

export function getToken(baseUrl?: string) {
  if (baseUrl) {
    return window.localStorage.getItem(`token_${baseUrl}`) || '';
  }
  // Fallback to old key for backward compatibility
  return window.localStorage.getItem('token') || '';
}

export function setToken(token: string, expireTime: number, baseUrl: string) {
  window.localStorage.setItem(`token_${baseUrl}`, token);
  window.localStorage.setItem(`expireTime_${baseUrl}`, expireTime.toString());
  // Also set the old key for backward compatibility
  window.localStorage.setItem('token', token);
  window.localStorage.setItem('expireTime', expireTime.toString());
}

export function isCompatibleField(field: Field): boolean {
  return field.type === 'Symbol';
}

export function getCompatibleFields(contentTypes: ContentType[]): CompatibleFields {
  return contentTypes.reduce((acc, ct) => {
    return {
      ...acc,
      [ct.sys.id]: (ct.fields || []).filter(isCompatibleField),
    };
  }, {});
}

export function editorInterfacesToSelectedFields(
  eis: EditorInterface[],
  appId?: string
): SelectedFields {
  return eis.reduce((acc, ei) => {
    const ctId = get(ei, ['sys', 'contentType', 'sys', 'id']);
    const controls = ei.controls || [];
    const fieldIds = controls
      .filter((control) => control.widgetNamespace === 'app' && control.widgetId === appId)
      .map((control) => control.fieldId)
      .filter((fieldId) => typeof fieldId === 'string' && fieldId.length > 0);

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
        fields.length > 0 ? { controls: fields.map((fieldId) => ({ fieldId })) } : {};

      return { ...acc, [id]: targetState };
    }, {}),
  };
}

export const isUserAuthenticated = (baseUrl?: string) => {
  return !!getToken(baseUrl);
};

export function validateParameters({ selectedWorkspaceId }: TypeFormParameters): string | null {
  if (typeof selectedWorkspaceId !== 'string' || !selectedWorkspaceId.length) {
    return 'Please select a valid Typeform workspace';
  }
  return null;
}
