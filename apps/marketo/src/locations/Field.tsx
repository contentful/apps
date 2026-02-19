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
import { useSDK } from '@contentful/react-apps-toolkit';

export type FormObject = {
  id: string;
  url: string;
  name: string;
};

interface ErrorState {
  error: boolean;
  message: string;
}

interface MarketoFormsResponse {
  result?: FormObject[];
}

// TODO: Replace with actual endpoint
const ENDPOINT = 'dummy-endpoint';
const EMPTY_FORM: FormObject = { id: '', name: '', url: '' };
const DROPDOWN_EXPANDED_HEIGHT = 240;

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [forms, setForms] = useState<FormObject[] | null>(null);
  const [filteredForms, setFilteredForms] = useState<FormObject[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormObject>(EMPTY_FORM);
  const [loadingData, setLoadingStatus] = useState(true);
  const [error, updateError] = useState<ErrorState>({ error: false, message: '' });

  useEffect(() => {
    sdk.window.startAutoResizer();
  }, []);

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
        const fetchResponse = await fetch(ENDPOINT, {
          method: 'POST',
          body: JSON.stringify(sdk.parameters.installation),
          headers: {
            'Access-Control-Request-Method': 'POST',
            'Content-Type': 'application/json',
          },
        });

        //Check if needed to parse the response
        const response = (await fetchResponse.json()) as MarketoFormsResponse;

        if (!response.result) {
          updateError({
            error: true,
            message:
              'Something is wrong with the Marketo App. Please ask a space admin to check the configuration.',
          });
          setLoadingStatus(false);
          return;
        }

        setForms(response.result);
        setFilteredForms(response.result);

        const fieldValue = sdk.field.getValue();
        if (fieldValue?.id) {
          const preselectedForm = response.result.find((item) => item.id === fieldValue.id);
          setSelectedForm(preselectedForm || EMPTY_FORM);
        }

        setLoadingStatus(false);
      } catch {
        updateError({
          error: true,
          message: 'Could not load Marketo forms. Please try again or contact a space admin.',
        });
        setLoadingStatus(false);
      }
    };

    loadForms();
  }, [sdk.field]);

  if (loadingData) {
    return (
      <Flex alignItems="center" gap="spacingXs">
        <Paragraph marginBottom="none">Loading Marketo data</Paragraph>
        <Spinner color="primary" />
      </Flex>
    );
  }

  if (error.error) {
    return <Note variant="negative">{error.message}</Note>;
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
