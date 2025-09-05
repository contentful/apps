import { Box, Checkbox, Text } from '@contentful/f36-components';
import Splitter from './Splitter';
import { selectAllCheckboxStyles, selectAllTextStyles } from './GenericMultiselect.styles';

interface CustomMultiselectAllProps {
  areAllSelected: boolean;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CustomMultiselectAll = ({
  areAllSelected,
  disabled,
  onChange,
}: CustomMultiselectAllProps) => {
  return (
    <Box>
      <Checkbox
        className={selectAllCheckboxStyles(areAllSelected)}
        isDisabled={disabled}
        isChecked={areAllSelected}
        onChange={onChange}>
        <Text className={selectAllTextStyles}>
          {areAllSelected ? 'Deselect All' : 'Select All'}
        </Text>
      </Checkbox>
      <Splitter />
    </Box>
  );
};

export default CustomMultiselectAll;
