import { FormControl, Select } from '@contentful/f36-components';

const SourceKeywords = () => {
  return (
    <FormControl>
      <FormControl.Label>What should be the source to generate keywords from?</FormControl.Label>
      <Select
        defaultValue=""
        onChange={(event) => {
          const field = [...richTextFields, ...textFields].find(
            (field) => field.name === event.target.value
          );
          const value = field.currentEditor ? sdk.entry.fields[field.name].getValue() : field.data;
          setPrompt(documentToPlainTextString(value));
        }}>
        <Select.Option value="" isDisabled>
          Select a field...
        </Select.Option>
        {[...richTextFields, ...textFields].map((field, index) => {
          return (
            <Select.Option value={field.name} key={index}>
              {getFieldName(field.name)}
            </Select.Option>
          );
        })}
      </Select>
    </FormControl>
  );
};

export default SourceKeywords;
