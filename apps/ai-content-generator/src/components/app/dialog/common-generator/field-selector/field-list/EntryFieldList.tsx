import { Box, FormControl, Select } from '@contentful/f36-components';
import { Field } from '@hooks/dialog/useSupportedFields';
import { ChangeEvent } from 'react';

interface Props {
  title: string;
  selectedField: string;
  fields: Field[];
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  selectFieldWidth?: number;
}

function EntryFieldList(props: Props) {
  const { title, selectedField, fields, onChange, selectFieldWidth } = props;

  const fieldList = fields.map((field) => (
    <Select.Option key={field.key} value={field.key}>
      {field.name}
    </Select.Option>
  ));

  return (
    <Box css={{ width: selectFieldWidth }}>
      <FormControl marginLeft="spacingXs" marginRight="spacingXs" marginBottom="none">
        <FormControl.Label>{title}</FormControl.Label>
        <Select value={selectedField} onChange={onChange}>
          <Select.Option value="" isDisabled>
            Select field...
          </Select.Option>
          {fieldList}
        </Select>
      </FormControl>
    </Box>
  );
}

export default EntryFieldList;
