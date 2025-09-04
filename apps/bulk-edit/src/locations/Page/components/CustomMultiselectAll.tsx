import { Box, Checkbox, Text } from '@contentful/f36-components';
import { selectAllCheckboxStyles, selectAllTextStyles } from './CustomMultiselectAll.styles';
import Splitter from './Splitter';

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
