import { FormControl, Select } from '@contentful/f36-components';

const Field = () => {
  return (
    <FormControl>
      <FormControl.Label>Which field should be translated?</FormControl.Label>
      <Select defaultValue="" onChange={(event) => setField(event.target.value)}>
        <Select.Option value="" isDisabled>
          Select a field...
        </Select.Option>
        {translateableTextFields.map((field, index) => {
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

export default Field;
