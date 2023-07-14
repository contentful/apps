import { FormControl, Select } from '@contentful/f36-components';
import { Field } from '../../../../../hooks/dialog/useSupportedFields';
import { ChangeEvent } from 'react';

interface Props {
  title: string;
  selectedField: string;
  fields: Field[];
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}

function EntryFieldList(props: Props) {
  const { title, selectedField, fields, onChange } = props;

  const fieldList = fields.map((field) => (
    <Select.Option key={field.name} value={field.name}>
      {field.name}
    </Select.Option>
  ));

  return (
    <FormControl>
      <FormControl.Label>{title}</FormControl.Label>
      <Select value={selectedField} onChange={onChange}>
        {fieldList}
      </Select>
    </FormControl>
  );
}

export default EntryFieldList;
