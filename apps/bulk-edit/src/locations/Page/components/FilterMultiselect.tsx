import { Flex } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { useMemo } from 'react';
import { truncate } from '../utils/entryUtils';
import { optionStyles } from './FilterMultiselect.styles';
import { FilterOption } from '../types';

interface FilterMultiselectProps {
  id?: string;
  options: FilterOption[];
  selectedItems: FilterOption[];
  setSelectedItems: (items: FilterOption[]) => void;
  disabled?: boolean;
  placeholderConfig: {
    noneSelected: string;
    allSelected: string;
    singleSelected: string;
    multipleSelected: string;
  };
  style?: React.CSSProperties | undefined;
}

const FilterMultiselect = ({
  id,
  options,
  selectedItems,
  setSelectedItems,
  disabled,
  placeholderConfig,
  style,
}: FilterMultiselectProps) => {
  const getPlaceholderText = () => {
    if (selectedItems.length === 0) return placeholderConfig.noneSelected;
    if (selectedItems.length === options.length) return placeholderConfig.allSelected;
    if (selectedItems.length === 1) {
      return selectedItems[0].label;
    }
    const firstLabel = selectedItems[0].label;
    return `${firstLabel} and ${selectedItems.length - 1} more`;
  };

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (checked) {
      setSelectedItems(options);
    } else {
      setSelectedItems([]);
    }
  };

  const areAllSelected = useMemo(() => {
    return options.every((option) => selectedItems.some((item) => item.value === option.value));
  }, [selectedItems, options]);

  return (
    <Flex gap="spacing2Xs" flexDirection="column" style={{ ...style }}>
      <Multiselect
        placeholder={getPlaceholderText()}
        triggerButtonProps={{ size: 'small', isDisabled: disabled }}
        popoverProps={{ isFullWidth: true }}>
        <Multiselect.SelectAll
          itemId={`selectAll-${id}`}
          onSelectItem={toggleAll}
          isDisabled={disabled}
          isChecked={areAllSelected}
        />
        {options.map((option) => (
          <Multiselect.Option
            isDisabled={disabled}
            className={optionStyles}
            key={option.value}
            label={truncate(option.label, 30)}
            value={option.value}
            itemId={`option-${id}-${option.value}`}
            isChecked={selectedItems.some((item) => item.value === option.value)}
            onSelectItem={(e) => {
              const checked = e.target.checked;
              if (checked) {
                setSelectedItems([...selectedItems, option]);
              } else {
                setSelectedItems(selectedItems.filter((item) => item.value !== option.value));
              }
            }}
          />
        ))}
      </Multiselect>
    </Flex>
  );
};

export default FilterMultiselect;
