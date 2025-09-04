import { Flex } from '@contentful/f36-components';
import {
  Multiselect,
  MultiselectOption as F36MultiselectOption,
} from '@contentful/f36-multiselect';
import { useMemo } from 'react';
import { truncate } from '../utils/entryUtils';
import { optionStyles } from './CustomMultiselectAll.styles';
import CustomMultiselectAll from './CustomMultiselectAll';
import { styles } from '../styles';

export interface BaseMultiselectOption {
  label: string;
}

interface GenericMultiselectProps<T extends BaseMultiselectOption> {
  options: T[];
  selectedItems: T[];
  setSelectedItems: (items: T[]) => void;
  disabled?: boolean;
  placeholderConfig: {
    noneSelected: string;
    allSelected: string;
    singleSelected: string;
    multipleSelected: string;
  };
  truncateLength?: number;
  getItemKey: (item: T) => string;
  getItemValue: (item: T) => string;
  isItemSelected: (item: T, selectedItems: T[]) => boolean;
}

const GenericMultiselect = <T extends BaseMultiselectOption>({
  options,
  selectedItems,
  setSelectedItems,
  disabled,
  placeholderConfig,
  truncateLength = 30,
  getItemKey,
  getItemValue,
  isItemSelected,
}: GenericMultiselectProps<T>) => {
  const getPlaceholderText = () => {
    if (selectedItems.length === 0) return placeholderConfig.noneSelected;
    if (selectedItems.length === options.length) return placeholderConfig.allSelected;
    if (selectedItems.length === 1) return selectedItems[0].label;
    return `${selectedItems[0].label} and ${selectedItems.length - 1} more`;
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
    return options.every((option) => isItemSelected(option, selectedItems));
  }, [selectedItems, options, isItemSelected]);

  return (
    <Flex gap="spacing2Xs" flexDirection="column" style={styles.columnMultiselect}>
      <Multiselect
        placeholder={getPlaceholderText()}
        triggerButtonProps={{ size: 'small' }}
        popoverProps={{ isFullWidth: true }}>
        <CustomMultiselectAll
          areAllSelected={areAllSelected}
          disabled={disabled}
          onChange={toggleAll}
        />
        {options.map((option) => (
          <F36MultiselectOption
            isDisabled={disabled}
            className={optionStyles}
            key={getItemKey(option)}
            label={truncate(option.label, truncateLength)}
            value={getItemValue(option)}
            itemId={getItemKey(option)}
            isChecked={isItemSelected(option, selectedItems)}
            onSelectItem={(e) => {
              const checked = e.target.checked;
              if (checked) {
                setSelectedItems([...selectedItems, option]);
              } else {
                setSelectedItems(
                  selectedItems.filter((item) => getItemKey(item) !== getItemKey(option))
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
