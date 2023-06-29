import { FormControl, Select } from '@contentful/f36-components';

const TargetLanguage = () => {
  return (
    <FormControl>
      <FormControl.Label>Target Language</FormControl.Label>
      <Select
        value={targetLocale || ''}
        onChange={(event) => {
          setTargetLocale(event.target.value);
          if (event.target.value === sourceLocale) setSourceLocale('');
        }}>
        <Select.Option value="" isDisabled>
          Where to translate into?
        </Select.Option>
        {sdk.locales.available.map((locale, index) => {
          return (
            <Select.Option value={locale} key={index} isDisabled={locale === sourceLocale}>
              {sdk.locales.names[locale]}
            </Select.Option>
          );
        })}
      </Select>
    </FormControl>
  );
};

export default TargetLanguage;
