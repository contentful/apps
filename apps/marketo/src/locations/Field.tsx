import { useState, useEffect } from 'react';
import { Paragraph, Flex, Button, Spinner, Autocomplete } from '@contentful/f36-components';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';

interface FormObject {
  id: string;
  url: string;
  name: string;
}

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [forms, updateForms] = useState<FormObject[] | null>(null);
  const [filteredForms, updateFilteredForms] = useState<FormObject[]>([]);
  const [selectedForm, updateSelectedForm] = useState<FormObject | undefined>(undefined);
  const [loadingData, updateLoadingStatus] = useState(true);
  const [error, updateError] = useState({ error: false, message: '' });

  useAutoResizer();

  const updateFieldValue = (form: FormObject | null) => {
    if (!form) {
      return;
    }
    sdk.field.setValue({ id: form.id, url: form.url });
    updateSelectedForm(form);
    if (forms) {
      updateFilteredForms(forms.filter((item) => item.id !== form.id));
    }
  };

  const handleFormInputChange = (value: string) => {
    const normalizedValue = value.trim().toLowerCase();
    if (!forms) {
      updateFilteredForms([]);
      return;
    }
    updateFilteredForms(
      forms.filter((form) => {
        if (selectedForm && selectedForm.id === form.id) {
          return false;
        }
        return form.name.toLowerCase().includes(normalizedValue);
      })
    );
  };

  const removeFieldValue = () => {
    sdk.field.setValue(null);
    updateSelectedForm(undefined);
    updateFilteredForms(forms || []);
    return;
  };

  // TODO: Replace with actual endpoint
  const ENDPOINT = 'dummy-endpoint';

  useEffect(() => {
    //Get list of available forms to from Marketo selection
    (async () => {
      try {
        const response = await (
          await fetch(ENDPOINT, {
            method: 'POST',
            body: JSON.stringify(sdk.parameters.installation),
            headers: {
              'Access-Control-Request-Method': 'POST',
              'Content-Type': 'application/json',
            },
          })
        ).json();

        if (response.result) {
          const mappedResponse = response.result.map((item: FormObject) => {
            return {
              id: item.id,
              url: item.url,
              name: item.name,
            };
          });
          updateForms(mappedResponse);
          updateFilteredForms(mappedResponse);
          updateLoadingStatus(false);

          const fieldValue = sdk.field.getValue();
          if (fieldValue?.id) {
            const preselectedForm = mappedResponse.find(
              (item: FormObject) => item.id === fieldValue.id
            );
            updateSelectedForm(preselectedForm || undefined);
          }
        } else {
          updateError({
            error: true,
            message:
              'Something is wrong with the Marketo App. Please ask a space admin to check the configuration.',
          });
        }
      } catch (error) {
        console.log(error);
      }
    })();

    // Set field value in local state
  }, [sdk]); //Think about this

  return (
    <>
      {loadingData ? (
        <>
          {error.error ? (
            <Paragraph>{error.message}</Paragraph>
          ) : (
            <Paragraph>
              Loading Marketo data <Spinner color={'primary'} />
            </Paragraph>
          )}
        </>
      ) : (
        <Flex flexDirection={'column'} fullHeight={true}>
          {forms && forms.length > 0 && (
            <>
              <Autocomplete<FormObject>
                items={filteredForms.filter((item) => item.id !== selectedForm?.id)}
                selectedItem={selectedForm}
                onInputValueChange={handleFormInputChange}
                onSelectItem={updateFieldValue}
                placeholder="Select a form"
                itemToString={(item) => (item ? item.name : '')}
                renderItem={(item) => item.name}
                listWidth="full"
              />
              {selectedForm && (
                <Flex marginTop={'spacingS'}>
                  <Button onClick={() => removeFieldValue()}>Remove Form</Button>
                </Flex>
              )}
            </>
          )}
        </Flex>
      )}
    </>
  );
};

export default Field;
