import { Flex, Text } from '@contentful/f36-components';
import { Multiselect, MultiselectOption } from '@contentful/f36-multiselect';
import { css } from 'emotion';
import { CSSProperties, useMemo } from 'react';
import { truncate } from '../utils/entryUtils';

const ColumnMultiselect = ({
  options,
  selectedFields,
  setSelectedFields,
  style,
}: {
  options: { label: string; value: string }[];
  selectedFields: { label: string; value: string }[];
  setSelectedFields: (fields: { label: string; value: string }[]) => void;
  style?: CSSProperties;
}) => {
  const getPlaceholderText = () => {
    if (selectedFields.length === 0) return 'No fields selected';
    if (selectedFields.length === options.length) return 'Filter fields';
    if (selectedFields.length === 1) return selectedFields[0].label;
    return `${selectedFields[0].label} and ${selectedFields.length - 1} more`;
  };

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (checked) {
      setSelectedFields(options);
    } else {
      setSelectedFields([]);
    }
  };

  const areAllSelected = useMemo(() => {
    return options.every((option) => selectedFields.some((field) => field.value === option.value));
  }, [selectedFields, options]);

  return (
    <Flex gap="spacing2Xs" flexDirection="column" style={style}>
      <Multiselect
        placeholder={getPlaceholderText()}
        triggerButtonProps={{ size: 'small' }}
        popoverProps={{ isFullWidth: true }}>
        <Multiselect.SelectAll onSelectItem={toggleAll} isChecked={areAllSelected} />
        {options.map((option) => (
          <MultiselectOption
            className={css`
              font-size: 12px;
            `}
            key={option.value}
            label={truncate(option.label, 30)}
            value={option.value}
            itemId={option.value}
            isChecked={selectedFields.some((field) => field.value === option.value)}
            onSelectItem={(e) => {
              const checked = e.target.checked;
              if (checked) {
                setSelectedFields([...selectedFields, option]);
              } else {
                setSelectedFields(selectedFields.filter((field) => field.value !== option.value));
              }
            }}
          />
        ))}
      </Multiselect>
    </Flex>
  );
};

export default ColumnMultiselect;
