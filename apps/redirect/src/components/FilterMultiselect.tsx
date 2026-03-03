import { Box, Multiselect } from '@contentful/f36-components';
import { redirectsTableStyles as styles } from './RedirectsTable.styles';
import { SetStateAction } from 'react';

const getLabel = (filter: string, value: string[]) => {
  if (value.length === 0) return `Filter by ${filter}`;
  if (value.length === 1) return value[0];
  return `${value[0]} and ${value.length - 1} more`;
};

type FilterMultiselectProps = {
  type: 'type' | 'status';
  options: string[];
  selectedItems: string[];
  setSelectedItems: (value: SetStateAction<string[]>) => void;
  handleToggleFilter: (
    value: string,
    checked: boolean,
    setFilter: (value: SetStateAction<string[]>) => void
  ) => void;
};

const FilterMultiselect = ({
  type,
  options,
  selectedItems,
  setSelectedItems,
  handleToggleFilter,
}: FilterMultiselectProps) => {
  return (
    <Box style={styles.select}>
      <Multiselect placeholder={getLabel(type, selectedItems)}>
        {options.map((option) => (
          <Multiselect.Option
            key={option}
            value={option}
            itemId={`type-${option}`}
            isChecked={selectedItems.includes(option)}
            onSelectItem={(e) => handleToggleFilter(option, e.target.checked, setSelectedItems)}>
            {option}
          </Multiselect.Option>
        ))}
      </Multiselect>
    </Box>
  );
};

export default FilterMultiselect;
