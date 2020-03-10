import React, { useEffect, useState } from 'react';
import { AppExtensionSDK, FieldExtensionSDK } from 'contentful-ui-extensions-sdk';
import { TextInput, Select, Option } from '@contentful/forma-36-react-components';
import * as typeformEmbed from '@typeform/embed';
import { TypeformPreviewWidget } from './TypeFormWidget';
import { TypeFormResponse } from './interfaces';

interface Props {
  sdk: any;
}

interface InstallationParameters {
  workspaceId: string;
  accessToken: string;
}

interface FormOption {
  name: string;
  href: string;
  id: string;
}

export function TypeFormField({ sdk }: Props) {
  const { workspaceId, accessToken } = sdk.parameters.installation as InstallationParameters;
  const [selectedForm, setSelectedForm] = useState('');
  const [forms, setForms] = useState<FormOption[]>([]);

  useEffect(() => {
    const fetchForms = async () => {
      const response = (await (
        await fetch('http://localhost:3000/forms')
      ).json()) as TypeFormResponse;

      const normalizedForms = normalizeFormResponse(response);
      setForms(normalizedForms);
      sdk.window.updateHeight(500);
    };
    fetchForms();
  }, []);

  const onChange = (event: any) => {
    setSelectedForm(event.currentTarget.value);
  };

  const normalizeFormResponse = (typeFormResponse: TypeFormResponse): FormOption[] => {
    return typeFormResponse.forms.items.map(form => ({
      name: form.title,
      href: form._links.display,
      id: form.id
    }));
  };

  return (
    <React.Fragment>
      <Select onChange={onChange}>
        <Option key="" value="">
          Choose a typeform
        </Option>
        {forms.map(form => (
          <Option key={form.id} value={form.href}>
            {form.name}
          </Option>
        ))}
      </Select>
      <TypeformPreviewWidget src={selectedForm} />
    </React.Fragment>
  );
}
