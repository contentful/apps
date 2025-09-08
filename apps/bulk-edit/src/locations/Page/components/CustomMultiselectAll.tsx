import { Box, Checkbox, Text } from '@contentful/f36-components';
import Splitter from './Splitter';
import {
  selectAllCheckboxBaseStyles,
  selectAllCheckboxSelectedStyles,
  selectAllCheckboxUnselectedStyles,
  selectAllTextStyles,
  selectAllCheckboxDisabledStyles,
  selectAllTextDisabledStyles,
} from './GenericMultiselect.styles';

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
        className={`${selectAllCheckboxBaseStyles} ${
          areAllSelected ? selectAllCheckboxSelectedStyles : selectAllCheckboxUnselectedStyles
        } ${disabled ? selectAllCheckboxDisabledStyles : ''}`}
        isDisabled={disabled}
        isChecked={areAllSelected}
        onChange={onChange}>
        <Text className={`${selectAllTextStyles} ${disabled ? selectAllTextDisabledStyles : ''}`}>
          {areAllSelected ? 'Deselect All' : 'Select All'}
        </Text>
      </Checkbox>
      <Splitter />
    </Box>
  );
};

export default CustomMultiselectAll;
