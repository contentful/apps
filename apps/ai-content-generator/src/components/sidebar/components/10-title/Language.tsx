import { FormControl, Select } from '@contentful/f36-components';

const Language = () => {
  return (
    <FormControl>
      <FormControl.Label>What language?</FormControl.Label>
      <Select onChange={(event) => setTargetLocale(event.target.value)} defaultValue={sourceLocale}>
        <Select.Option defaultValue="" isDisabled>
          Select a language...
        </Select.Option>
        {sdk.locales.available.map((locale) => (
          <Select.Option value={locale} key={locale}>
            {sdk.locales.names[locale]}
          </Select.Option>
        ))}
      </Select>
    </FormControl>
  );
};

export default Language;
