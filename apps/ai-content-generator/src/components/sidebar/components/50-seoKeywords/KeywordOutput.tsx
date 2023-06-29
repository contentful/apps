import { FormControl, Select } from '@contentful/f36-components';

const KeywordOutput = () => {
  return (
    <FormControl>
      <FormControl.Label>Where should the keywords be output?</FormControl.Label>{' '}
      <Select defaultValue={field} onChange={(event) => setField(event.target.value)}>
        <Select.Option value="" isDisabled>
          Select a field...
        </Select.Option>
        {textFields.map((field, index) => {
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

export default KeywordOutput;
