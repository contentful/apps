import { Flex, Text } from '@contentful/f36-components';
import { Multiselect, MultiselectOption } from '@contentful/f36-multiselect';
import { useState } from 'react';

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
  return (
    <Flex style={{ maxWidth: '500px' }} gap="spacing2Xs" flexDirection="column">
      <Text fontWeight="fontWeightDemiBold">Filter by field</Text>
      <Multiselect placeholder="Select one or more">
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
