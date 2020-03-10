import React, { useEffect, useState } from 'react';
import { AppExtensionSDK } from 'contentful-ui-extensions-sdk';
import { TextInput, Select, Option } from '@contentful/forma-36-react-components';
import * as typeformEmbed from '@typeform/embed';
import { TypeFormResponse } from './interfaces';

interface Props {
  sdk: AppExtensionSDK;
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
    };
    fetchForms();
  }, []);

  const onChange = () => {};

  const normalizeFormResponse = (typeFormResponse: TypeFormResponse): FormOption[] => {
    return typeFormResponse.forms.items.map(form => ({
      name: form.title,
      href: form._links.display,
      id: form.id
    }));
  };

  return (
    <React.Fragment>
      <Select>
        <Option key="" value="">
          Choose a typeform
        </Option>
        {forms.map(form => (
          <Option key={form.id} value={form.href}>
            {form.name}
          </Option>
        ))}
      </Select>
      <div>I will be the rendered form</div>
    </React.Fragment>
  );
}
