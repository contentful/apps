import { FormControl, Select } from '@contentful/f36-components';

const SourceLanguage = () => {
  return (
    <FormControl>
      <FormControl.Label>Source Language</FormControl.Label>
      <Select
        value={sourceLocale || ''}
        onChange={(event) => {
          setSourceLocale(event.target.value);
          if (event.target.value === targetLocale) setTargetLocale('');
        }}>
        <Select.Option value="" isDisabled>
          Where to translate from?
        </Select.Option>
        {sdk.locales.available.map((locale, index) => {
          return (
            <Select.Option value={locale} key={index}>
              {sdk.locales.names[locale]}
            </Select.Option>
          );
        })}
      </Select>
    </FormControl>
  );
};

export default SourceLanguage;
