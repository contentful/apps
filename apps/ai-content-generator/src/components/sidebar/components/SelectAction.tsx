import { FormControl, Select } from '@contentful/f36-components';

const SelectAction = ({ action, setAction }) => {
  return (
    <FormControl>
      <FormControl.Label>Select an action</FormControl.Label>
      <Select onChange={handleActionChange} value={option}>
        <Select.Option value="0" isDisabled>
          Select an option...
        </Select.Option>
        <Select.Option value="10">Generate a title</Select.Option>
        <Select.Option
          value="20"
          isDisabled={richTextFields?.filter((field) => field.currentEditor).length < 1}>
          Generate content
        </Select.Option>
        <Select.Option value="30" isDisabled={sdk.locales.available?.length < 1}>
          Translate content
        </Select.Option>
        <Select.Option value="40" isDisabled={richTextFields?.length < 1}>
          Generate SEO description
        </Select.Option>
        <Select.Option value="50" isDisabled={richTextFields?.length < 1}>
          Generate SEO keywords
        </Select.Option>
      </Select>
    </FormControl>
  );
};

export default SelectAction;
