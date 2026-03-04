import { useState, useEffect } from 'react';
import {
  Paragraph,
  Flex,
  Spinner,
  Autocomplete,
  FormControl,
  Note,
} from '@contentful/f36-components';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import type { FormObject, MarketoFormsResponse } from '../types';
import { GET_FORMS_APP_ACTION_ID } from '../const';

type ErrorState = {
  error: boolean;
  message: string;
};

const EMPTY_FORM: FormObject = { id: '', name: '', url: '' };
const DROPDOWN_EXPANDED_HEIGHT = 240;
const FORM_ERROR_MESSAGE =
  'Could not load Marketo forms. Please try again or contact a space admin.';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  useAutoResizer();
  const [forms, setForms] = useState<FormObject[] | null>(null);
  const [filteredForms, setFilteredForms] = useState<FormObject[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormObject>(EMPTY_FORM);
  const [loadingData, setLoadingStatus] = useState(true);
  const [error, updateError] = useState<ErrorState>({ error: false, message: '' });

  const handleDropdownOpen = () => {
    sdk.window.stopAutoResizer();
    sdk.window.updateHeight(DROPDOWN_EXPANDED_HEIGHT);
  };

  const handleDropdownClose = () => {
    sdk.window.startAutoResizer();
  };

  const updateFieldValue = (form: FormObject | null) => {
    if (!form) {
      return;
    }
    sdk.field.setValue({ id: form.id, url: form.url });
    setSelectedForm(form);
    if (forms) {
      setFilteredForms(forms.filter((item) => item.id !== form.id));
    }
  };

  const handleFormInputChange = (value: string) => {
    if (!value && selectedForm?.id) {
      removeFieldValue();
      return;
    }

    const normalizedValue = value.trim().toLowerCase();
    if (!forms) {
      setFilteredForms([]);
      return;
    }
    setFilteredForms(
      forms.filter((form) => {
        if (selectedForm && selectedForm.id === form.id) {
          return false;
        }
        return form.name.toLowerCase().includes(normalizedValue);
      })
    );
  };

  const removeFieldValue = () => {
    sdk.field.setValue(EMPTY_FORM);
    setSelectedForm(EMPTY_FORM);
    setFilteredForms(forms || []);
  };

  useEffect(() => {
    const loadForms = async () => {
      try {
        const { response } = await sdk.cma.appActionCall.createWithResponse(
          {
            appDefinitionId: sdk.ids.app!,
            appActionId: GET_FORMS_APP_ACTION_ID,
          },
          {
            parameters: {},
          }
        );

        const result = JSON.parse(response.body) as MarketoFormsResponse;

        if (!result.forms) {
          updateError({
            error: true,
            message: FORM_ERROR_MESSAGE,
          });
          setLoadingStatus(false);
          return;
        }

        setForms(result.forms);
        setFilteredForms(result.forms);

        const fieldValue = sdk.field.getValue();
        if (fieldValue?.id) {
          const preselectedForm = result.forms.find((form) => form.id === fieldValue.id);
          setSelectedForm(preselectedForm || EMPTY_FORM);
        }

        setLoadingStatus(false);
      } catch {
        updateError({
          error: true,
          message: FORM_ERROR_MESSAGE,
        });
        setLoadingStatus(false);
      }
    };

    loadForms();
  }, [sdk.field]);

  if (loadingData) {
    return (
      <Flex alignItems="center" gap="spacingXs">
        <Paragraph marginBottom="none">Loading Marketo forms</Paragraph>
        <Spinner color="primary" />
      </Flex>
    );
  }

  if (error.error) {
    return <Note variant="negative">{error.message}</Note>;
  }

  if (forms && forms.length === 0) {
    return <Note variant="warning">No Marketo forms found</Note>;
  }

  return (
    <Flex flexDirection="column" fullHeight style={{ width: '99%' }}>
      {forms && forms.length > 0 && (
        <>
          <FormControl>
            <Autocomplete<FormObject>
              items={filteredForms.filter((item) => item.id !== selectedForm?.id)}
              selectedItem={selectedForm}
              onInputValueChange={handleFormInputChange}
              onSelectItem={updateFieldValue}
              onOpen={handleDropdownOpen}
              onClose={handleDropdownClose}
              placeholder="Select a form"
              itemToString={(item) => (item ? item.name : '')}
              renderItem={(item) => item.name}
              listWidth="full"
            />
          </FormControl>
        </>
      )}
    </Flex>
  );
};

export default Field;
