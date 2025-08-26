import { Flex, Text } from '@contentful/f36-components';
import { Multiselect, MultiselectOption } from '@contentful/f36-multiselect';
import { useMemo, useState } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';
import { multiselectOverrides } from './FieldColumns.styles';

const options = [
  { label: 'Display name', value: 'displayName' },
  { label: 'Updated at', value: 'updatedAt' },
];

const FilterColumns = ({
  options,
  selectedFields,
  setSelectedFields,
}: {
  options: { label: string; value: string }[];
  selectedFields: { label: string; value: string }[];
  setSelectedFields: (fields: { label: string; value: string }[]) => void;
}) => {
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
    <Flex style={{ maxWidth: '500px' }} gap="spacing2Xs" flexDirection="column">
      <Multiselect placeholder="Filter columns" css={multiselectOverrides}>
        <Multiselect.SelectAll onSelectItem={toggleAll} isChecked={areAllSelected} />
        {options.map((option) => (
          <MultiselectOption
            key={option.value}
            label={option.label}
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

export default FilterColumns;
