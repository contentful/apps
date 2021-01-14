import React, { useEffect, useReducer } from 'react';
import { FieldExtensionSDK, AppExtensionSDK } from '@contentful/app-sdk';
import { Select, Option, TextLink, Note, Tooltip } from '@contentful/forma-36-react-components';
import { TypeFormResponse, FormOption, InstallationParameters } from '../typings';
import { TypeformOAuth } from '../Auth/TypeformOAuth';
import { styles } from './styles';
// @ts-ignore 2307
import logo from './typeform-icon.svg';
import { isUserAuthenticated, getToken, resetLocalStorage } from '../utils';


interface Props {
  sdk: FieldExtensionSDK & AppExtensionSDK;
}

enum ACTION_TYPES {
  INIT = 'INIT',
  UPDATE_VALUE = 'UPDATE_VALUE',
  UPDATE_TOKEN = 'UPDATE_TOKEN',
  RESET = 'RESET',
  ERROR = 'ERROR'
}

const initialState = {
  error: false,
  value: '',
  selectedForm: {
    name: '',
    href: '',
    isPublic: true,
    id: ''
  } as FormOption,
  hasStaleData: false,
  token: getToken(),
  forms: [] as FormOption[],
  loading: true
};
const AUTH_ERROR_CODES = [401, 403];

const isStaleData = (value: string, forms: FormOption[]): boolean => {
  if (value) {
    if (forms.length === 0) {
      return true;
    } else {
      if (forms.find(form => form.href === value)) {
        return false;
      } else {
        return true;
      }
    }
  } else {
    return false;
  }
};

const getSelectedForm = (value: string, forms: FormOption[]) => {
  return forms.find(form => form.href === value) || initialState.selectedForm;
};

export function TypeFormField({ sdk }: Props) {
  const { selectedWorkspaceId } = sdk.parameters.installation as InstallationParameters;
  const [state, dispatch] = useReducer(reducer, initialState);
  const { loading, forms, value, hasStaleData, selectedForm, error, token } = state;

  function reducer(
    state = initialState,
    action: { type: string; payload?: any }
  ): typeof initialState {
    switch (action.type) {
      case ACTION_TYPES.INIT: {
        const { forms } = action.payload;
        const currentFieldValue = sdk.field.getValue();
        const hasStaleData = isStaleData(currentFieldValue, forms);
        return {
          ...state,
          value: currentFieldValue,
          selectedForm: getSelectedForm(currentFieldValue, forms),
          loading: false,
          forms,
          error: false,
          hasStaleData
        };
      }
      case ACTION_TYPES.UPDATE_VALUE: {
        const { value, forms } = action.payload;
        let selectedForm = initialState.selectedForm;
        if (value) {
          sdk.field.setValue(value);
          selectedForm = (forms as FormOption[]).find(form => form.href === value)!;
        } else {
          selectedForm = initialState.selectedForm;
          sdk.field.removeValue();
        }
        return { ...state, value, selectedForm, hasStaleData: false };
      }
      case ACTION_TYPES.RESET: {
        sdk.field.removeValue();
        return {
          ...state,
          value: '',
          hasStaleData: false,
          selectedForm: initialState.selectedForm
        };
      }
      case ACTION_TYPES.UPDATE_TOKEN: {
        const { token } = action.payload;
        return {
          ...state,
          loading: true,
          error: false,
          token
        };
      }
      case ACTION_TYPES.ERROR: {
        return { ...state, loading: false, error: true };
      }
      default:
        return state;
    }
  }

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await fetch(`/forms/${selectedWorkspaceId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (AUTH_ERROR_CODES.includes(response.status)) {
          // clear everything in case token is expired
          resetLocalStorage();
          dispatch({ type: ACTION_TYPES.RESET });
        } else {
          const result = (await response.json()) as TypeFormResponse;
          const normalizedForms = normalizeFormResponse(result);
          dispatch({
            type: ACTION_TYPES.INIT,
            payload: {
              forms: normalizedForms
            }
          });
        }
      } catch (error) {
        // only show error dialog is the user is logged in
        if (isUserAuthenticated()) {
          dispatch({ type: ACTION_TYPES.ERROR });
        }
      }
    };
    fetchForms();
    // Start auto resizer to adjust field height
    sdk.window.startAutoResizer();
  }, [token]);

  const onChange = (event: any) => {
    const value = event.currentTarget.value;
    dispatch({ type: ACTION_TYPES.UPDATE_VALUE, payload: { value, forms } });
  };

  const openDialog = async () => {
    await sdk.dialogs.openCurrentApp({
      width: 1000,
      parameters: {
        value
      },
      title: 'Form Preview',
      shouldCloseOnEscapePress: true,
      shouldCloseOnOverlayClick: true
    });
  };

  const normalizeFormResponse = (typeFormResponse: TypeFormResponse): FormOption[] => {
    return typeFormResponse.forms.items.map(form => ({
      name: form.title,
      href: form._links.display,
      id: form.id,
      isPublic: form.settings.is_public
    }));
  };

  if (!isUserAuthenticated()) {
    return (
      <TypeformOAuth
        data-test-id="typeform-auth"
        isFullWidth={false}
        setToken={(token: string) =>
          dispatch({ type: ACTION_TYPES.UPDATE_TOKEN, payload: { token } })
        }
      />
    );
  }

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <Note noteType="negative">
        We could not fetch your typeforms. Please make sure you have selected a valid Typeform
        workspace and are logged in.
      </Note>
    );
  }

  const PreviewButton = (
    <div className={styles.previewButton(!selectedForm.isPublic)}>
      <TextLink onClick={openDialog} disabled={!selectedForm.isPublic}>
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
        </svg>
        Preview
      </TextLink>
    </div>
  );

  return (
    <React.Fragment>
      <div className={styles.field}>
        <img src={logo} className={styles.logo} />
        <Select onChange={onChange} value={value} data-test-id="typeform-select">
          <Option key="" value="">
            {forms.length === 0 ? 'No forms available' : 'Choose a typeform'}
          </Option>
          {forms.map(form => (
            <Option key={form.id} value={form.href}>
              {form.name}
            </Option>
          ))}
        </Select>
      </div>
      {value && !hasStaleData && (
        <div className={styles.actionButtons}>
          <TextLink
            href={`https://admin.typeform.com/form/${selectedForm.id}/create`}
            target="_blank"
            icon="Edit"
            rel="noopener noreferrer"
            className={styles.editButton}
            disabled={!value}>
            Edit
          </TextLink>
          {selectedForm.isPublic ? (
            PreviewButton
          ) : (
            <Tooltip
              containerElement="span"
              content="You can not preview this typeform because it is private"
              place="right">
              {PreviewButton}
            </Tooltip>
          )}
          <TextLink
            href={`https://admin.typeform.com/form/${selectedForm.id}/results`}
            target="_blank"
            icon="Entry"
            rel="noopener noreferrer"
            className={styles.editButton}>
            Results
          </TextLink>
        </div>
      )}
      {hasStaleData && (
        <Note noteType="negative">
          The typeform you have selected in Contentful no longer exists in your workspace.{' '}
          <TextLink onClick={() => dispatch({ type: ACTION_TYPES.RESET })}>Clear field</TextLink>.
        </Note>
      )}
    </React.Fragment>
  );
}
