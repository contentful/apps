import { Box, FormControl, Select } from '@contentful/f36-components';
import { ChangeEvent } from 'react';

interface Props {
  title: string;
  selectedValue: string;
  options: JSX.Element[];
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  selectFieldWidth?: number;
}

function Selector(props: Props) {
  const { title, selectedValue, options, onChange, selectFieldWidth } = props;

  return (
    <Box css={{ width: selectFieldWidth }}>
      <FormControl marginLeft="spacingXs" marginRight="spacingXs" marginBottom="none">
        <FormControl.Label>{title}</FormControl.Label>
        <Select value={selectedValue} onChange={onChange}>
          {options}
        </Select>
      </FormControl>
    </Box>
  );
}

export default Selector;
