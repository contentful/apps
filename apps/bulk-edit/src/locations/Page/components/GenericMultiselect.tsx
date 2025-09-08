import { Flex } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { useMemo } from 'react';
import { truncate } from '../utils/entryUtils';
import CustomMultiselectAll from './CustomMultiselectAll';
import { styles } from '../styles';
import { optionStyles } from './GenericMultiselect.styles';

export interface FilterOption {
  label: string;
  value: string;
}

interface GenericMultiselectProps<T> {
  options: FilterOption[];
  selectedItems: T[];
  setSelectedItems: (items: T[]) => void;
  disabled?: boolean;
  placeholderConfig: {
    noneSelected: string;
    allSelected: string;
    singleSelected: string;
    multipleSelected: string;
  };
  isItemSelected: (item: FilterOption, selectedItems: T[]) => boolean;
}

const GenericMultiselect = <T,>({
  options,
  selectedItems,
  setSelectedItems,
  disabled,
  placeholderConfig,
  isItemSelected,
}: GenericMultiselectProps<T>) => {
  const getItemLabel = (item: T): string => {
    if (typeof item === 'object' && item !== null && 'label' in item) {
      return (item as { label: string }).label;
    }

    return String(item);
  };

  const getItemValue = (item: T): string => {
    if (typeof item === 'object' && item !== null && 'value' in item) {
      return (item as { value: string }).value;
    }

    return getItemLabel(item).toLowerCase();
  };

  const getPlaceholderText = () => {
    if (selectedItems.length === 0) return placeholderConfig.noneSelected;
    if (selectedItems.length === options.length) return placeholderConfig.allSelected;
    if (selectedItems.length === 1) {
      return getItemLabel(selectedItems[0]);
    }
    const firstLabel = getItemLabel(selectedItems[0]);
    return `${firstLabel} and ${selectedItems.length - 1} more`;
  };

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (checked) {
      setSelectedItems(options as T[]);
    } else {
      setSelectedItems([]);
    }
  };

  const areAllSelected = useMemo(() => {
    return options.every((option) => isItemSelected(option, selectedItems));
  }, [selectedItems, options, isItemSelected]);

  return (
    <Flex gap="spacing2Xs" flexDirection="column" style={styles.columnMultiselect}>
      <Multiselect
        placeholder={getPlaceholderText()}
        triggerButtonProps={{ size: 'small', isDisabled: disabled }}
        popoverProps={{ isFullWidth: true }}>
        <CustomMultiselectAll
          areAllSelected={areAllSelected}
          disabled={disabled}
          onChange={toggleAll}
        />
        {options.map((option) => (
          <Multiselect.Option
            isDisabled={disabled}
            className={optionStyles}
            key={option.value}
            label={truncate(option.label, 30)}
            value={option.value}
            itemId={option.value}
            isChecked={isItemSelected(option, selectedItems)}
            onSelectItem={(e) => {
              const checked = e.target.checked;
              if (checked) {
                setSelectedItems([...selectedItems, option as T]);
              } else {
                setSelectedItems(
                  selectedItems.filter((field) => {
                    return getItemValue(field) !== option.value;
                  })
                );
              }
            }}
          />
        ))}
      </Multiselect>
    </Flex>
  );
};

export default GenericMultiselect;
