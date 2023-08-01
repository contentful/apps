import { Box, FormControl, Select } from '@contentful/f36-components';

interface Props {
  title: string;
  isNewText: boolean;
  onChange: () => void;
  selectFieldWidth: number;
}

function EntryFieldList(props: Props) {
  const { title, isNewText, onChange, selectFieldWidth } = props;

  return (
    <Box css={{ width: selectFieldWidth }}>
      <FormControl marginLeft="spacingXs" marginRight="spacingXs" marginBottom="none">
        <FormControl.Label>{title}</FormControl.Label>
        <Select value={isNewText ? 'prompt' : 'field'} onChange={onChange}>
          <Select.Option value="prompt">Prompt</Select.Option>
          <Select.Option value="field">Field</Select.Option>
        </Select>
      </FormControl>
    </Box>
  );
}

export default EntryFieldList;
