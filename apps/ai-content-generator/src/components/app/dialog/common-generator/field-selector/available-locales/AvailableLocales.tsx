import { DialogAppSDK } from '@contentful/app-sdk';
import { FormControl, Select } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ChangeEvent } from 'react';

interface Props {
  title: string;
  selectedLocale: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

const AvailableLocale = (props: Props) => {
  const { title, selectedLocale, onChange } = props;
  const sdk = useSDK<DialogAppSDK>();

  const localeList = sdk.locales.available.map((locale) => {
    return (
      <Select.Option key={locale} value={locale}>
        {sdk.locales.names[locale]}
      </Select.Option>
    );
  });

  return (
    <FormControl>
      <FormControl.Label>{title}</FormControl.Label>
      <Select value={selectedLocale} onChange={onChange}>
        {localeList}
      </Select>
    </FormControl>
  );
};

export default AvailableLocale;
