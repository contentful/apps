import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  Button,
  Select,
  Option,
  Flex,
  Paragraph,
  Spinner,
} from '@contentful/forma-36-react-components';
import { FieldExtensionSDK } from '@contentful/app-sdk';

interface FieldProps {
  sdk: FieldExtensionSDK;
}

interface FormObject {
  id: string;
  url: string;
  name: string;
}

const Field = (props: FieldProps) => {
  const [forms, updateForms] = useState<FormObject[] | null>(null);
  const [selectedForm, updateSelectedForm] = useState<FormObject | null>(null);
  const [loadingData, updateLoadingStatus] = useState(true);
  const [error, updateError] = useState({ error: false, message: '' });

  props.sdk.window.startAutoResizer();

  const updateFieldValue = (event: ChangeEvent<HTMLSelectElement>) => {
    const id = event.target.value;
    const form = forms?.find((form) => form.id.toString() === id);
    if (id === 'none') {
      removeFieldValue();
    }
    props.sdk.field.setValue({ id: form?.id, url: form?.url });
    updateSelectedForm(form || null);
  };

  const removeFieldValue = () => {
    props.sdk.field.setValue(null);
    updateSelectedForm(null);
    return;
  };

  useEffect(() => {
    //Get list of available forms to from Marketo selection
    (async () => {
      try {
        const endpoint = process.env.REACT_APP_ENDPOINT
          ? `${process.env.REACT_APP_ENDPOINT}/api/getMarketoData`
          : '/api/getMarketoData';
        const response = await (
          await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(props.sdk.parameters.installation),
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
          updateLoadingStatus(false);
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
    const fieldValue = props.sdk.field.getValue();
    if (fieldValue !== undefined) {
      updateSelectedForm(fieldValue);
    }
  }, [props.sdk]); //Think about this

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
              <Select
                name="forms"
                id="forms"
                onChange={(event) => updateFieldValue(event)}
                value={selectedForm ? selectedForm.id : 'none'}>
                <Option id={'none'} key={'No form'} value={'none'}>
                  {selectedForm ? 'Remove form' : 'Select a form'}
                </Option>
                {forms.map((item) => (
                  <Option
                    disabled={selectedForm ? selectedForm.id === item.id : false}
                    key={`key-${item.id}`}
                    value={item.id}>
                    {item.name}
                  </Option>
                ))}
              </Select>
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
